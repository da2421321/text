package service

import (
	"errors"
	"time"

	"chamber-backend/internal/config"
	"chamber-backend/internal/model"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var (
	// 统一定义 service 层错误。
	// 这样做有两个目的：
	// 1. handler 层可以稳定地把业务错误映射成 HTTP 状态码，而不是依赖底层库的原始报错文本。
	// 2. 可以避免把数据库细节、唯一索引名、外键错误等内部实现直接暴露给前端。
	ErrConflict           = errors.New("resource conflict")
	ErrDependencyExists   = errors.New("resource has dependent records")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidReference   = errors.New("invalid reference")
	ErrInvalidState       = errors.New("invalid state")
	ErrNotFound           = errors.New("resource not found")
)

// Service 是业务层入口。
// 它的职责不是简单包一层 DB，而是把“数据库访问”和“业务约束”放在一起：
// 1. handler 不直接操作数据库，避免 HTTP 层和存储层耦合。
// 2. 关联校验、状态校验、错误翻译等规则都集中在这一层，后续更容易维护。
type Service struct {
	db *gorm.DB
}

// New 创建业务服务实例。
// 启动流程在这里集中完成：
// 1. 建立 GORM 与 MySQL 的连接。
// 2. 配置连接池，限制数据库资源占用并减少坏连接长期滞留。
// 3. 执行 AutoMigrate，保证本地开发和初始部署时表结构可用。
// 4. 确保默认管理员存在，方便系统第一次启动后立即登录。
func New(cfg config.Config) (*Service, error) {
	db, err := gorm.Open(mysql.Open(cfg.MySQLDSN), &gorm.Config{TranslateError: true})
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	// SetMaxIdleConns 表示连接池里最多保留多少条“空闲但可复用”的连接。
	// 这里设为 5，意思是高峰过去后最多留 5 条连接待命，减少频繁建连/断连的开销，
	// 同时避免空闲连接过多，长期占着数据库资源。
	sqlDB.SetMaxIdleConns(5)

	// SetMaxOpenConns 表示应用和数据库之间最多能同时打开多少条连接。
	// 这里设为 20，相当于给当前服务加一个并发上限，避免请求量上来时无限制抢占数据库连接，
	// 导致数据库被打满，或者把问题放大成全局阻塞。
	sqlDB.SetMaxOpenConns(20)

	// SetConnMaxIdleTime 表示一条连接在“空闲状态”下最多保留多久。
	// 这里设为 5 分钟，超过后连接会被连接池回收，适合清理长期闲置的旧连接，
	// 降低拿到失活连接、网络陈旧连接的概率。
	sqlDB.SetConnMaxIdleTime(5 * time.Minute)

	// SetConnMaxLifetime 表示一条连接从创建开始，最多可以存活多久，
	// 即使它还在被正常使用，超过这个时间后也会在归还连接池时被替换。
	// 这里设为 1 小时，主要是为了定期轮换老连接，降低长连接因为网络抖动、
	// 数据库重启、代理层超时等原因变“脏连接”的风险。
	sqlDB.SetConnMaxLifetime(time.Hour)

	// AutoMigrate 适合当前这个项目阶段：
	// 代码结构简单，表数量少，可以在启动时自动保证基础表结构存在。
	// 如果后续进入严格的生产发布流程，再考虑切换成显式 migration 脚本。
	if err = db.AutoMigrate(
		&model.User{},
		&model.Organization{},
		&model.Member{},
		&model.Activity{},
		&model.FeeBill{},
		&model.Notice{},
	); err != nil {
		return nil, err
	}

	// 确保管理员账号存在，避免系统刚启动时因为没有用户而无法登录后台。
	if err = ensureAdmin(db, cfg.AdminUsername, cfg.AdminPassword); err != nil {
		return nil, err
	}

	return &Service{db: db}, nil
}

// Close 关闭底层数据库连接。
// 平时 HTTP 请求不需要主动调用它，但在进程退出时关闭连接可以避免资源泄漏，
// 也能让日志和监控里看到更完整的生命周期。
func (s *Service) Close() error {
	sqlDB, err := s.db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// Login 负责登录校验。
// 这里先按用户名查询，再用 bcrypt 比对密码哈希；
// 无论是“用户不存在”还是“密码错误”，都统一返回 ErrInvalidCredentials，
// 这样可以避免把账号是否存在的信息额外泄露给调用方。
func (s *Service) Login(username, password string) (*model.User, error) {
	var user model.User
	if err := s.db.Where("username = ?", username).First(&user).Error; err != nil {
		return nil, ErrInvalidCredentials
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}
	return &user, nil
}

// CreateOrganization 创建组织记录。
// 真正的字段清洗和参数合法性校验已经在请求 DTO 中完成，
// service 这里主要负责执行写入，并把数据库错误翻译成统一业务错误。
func (s *Service) CreateOrganization(org *model.Organization) error {
	return mapWriteError(s.db.Create(org).Error)
}

// ListOrganizations 返回组织列表。
// 当前按 id 倒序返回，目的是让最近新建的数据排在前面，方便后台管理页面查看。
func (s *Service) ListOrganizations() ([]model.Organization, error) {
	var list []model.Organization
	if err := s.db.Order("id desc").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

// GetOrganization 根据主键查询单个组织。
// 真正的“未找到”判断由通用的 takeByID 统一处理，避免每个方法重复写同样逻辑。
func (s *Service) GetOrganization(id uint) (*model.Organization, error) {
	return takeByID[model.Organization](s.db, id)
}

// UpdateOrganization 更新组织信息，并返回更新后的最新数据。
// 这里先查再更，而不是直接 Updates：
// 1. 可以明确区分“目标不存在”和“更新失败”。
// 2. 更新完成后再次查询，返回给前端的是数据库中的最终状态。
func (s *Service) UpdateOrganization(id uint, updates map[string]any) (*model.Organization, error) {
	org, err := s.GetOrganization(id)
	if err != nil {
		return nil, err
	}
	if err := mapWriteError(s.db.Model(org).Updates(updates).Error); err != nil {
		return nil, err
	}
	return s.GetOrganization(id)
}

// DeleteOrganization 删除组织。
// 如果这个组织下面还有会员等依赖数据，外键约束会阻止删除，
// 最终会被映射成 ErrDependencyExists，前端可以据此提示“先处理关联数据”。
func (s *Service) DeleteOrganization(id uint) error {
	return deleteByID[model.Organization](s.db, id)
}

// CreateMember 创建会员。
// 在真正写入前先校验 organization_id 是否有效，
// 这样可以在进入数据库层之前就把明显错误拦住，并返回更清晰的业务错误。
func (s *Service) CreateMember(member *model.Member) error {
	if err := s.ensureOrganizationExists(member.OrganizationID); err != nil {
		return err
	}
	return mapWriteError(s.db.Create(member).Error)
}

// ListMembers 返回会员列表。
// 当 organizationID 不为空时，会附加 where 条件做过滤；
// 这样一个接口就能同时覆盖“全量列表”和“按组织筛选”两种后台场景。
func (s *Service) ListMembers(organizationID *uint) ([]model.Member, error) {
	var list []model.Member

	query := s.db.Order("id desc")
	if organizationID != nil {
		query = query.Where("organization_id = ?", *organizationID)
	}

	if err := query.Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

// GetMember 根据主键查询单个会员。
func (s *Service) GetMember(id uint) (*model.Member, error) {
	return takeByID[model.Member](s.db, id)
}

// UpdateMember 更新会员信息。
// 如果本次更新里包含 organization_id，就会先验证新的组织是否存在，
// 避免会员被更新到一个不存在的组织下面，产生脏数据。
func (s *Service) UpdateMember(id uint, updates map[string]any) (*model.Member, error) {
	if organizationID, ok := getUintUpdate(updates, "organization_id"); ok {
		if err := s.ensureOrganizationExists(organizationID); err != nil {
			return nil, err
		}
	}

	member, err := s.GetMember(id)
	if err != nil {
		return nil, err
	}
	if err := mapWriteError(s.db.Model(member).Updates(updates).Error); err != nil {
		return nil, err
	}
	return s.GetMember(id)
}

// DeleteMember 删除会员记录。
// 如果会员已经被会费单等数据引用，数据库层会拒绝删除，
// service 会把这个拒绝统一翻译成依赖冲突错误。
func (s *Service) DeleteMember(id uint) error {
	return deleteByID[model.Member](s.db, id)
}

// CreateActivity 创建活动。
// 活动的时间区间是业务规则的一部分，所以在写库前先校验：
// end_time 不能早于 start_time，否则会形成天然无效的数据。
func (s *Service) CreateActivity(activity *model.Activity) error {
	if err := validateActivityWindow(activity.StartTime, activity.EndTime); err != nil {
		return err
	}
	return mapWriteError(s.db.Create(activity).Error)
}

// ListActivities 返回活动列表，默认按最新记录优先展示。
func (s *Service) ListActivities() ([]model.Activity, error) {
	var list []model.Activity
	if err := s.db.Order("id desc").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

// GetActivity 根据主键查询单个活动。
func (s *Service) GetActivity(id uint) (*model.Activity, error) {
	return takeByID[model.Activity](s.db, id)
}

// UpdateActivity 更新活动。
// 这里不能只检查 updates 里传进来的字段，因为更新可能只改 start_time 或只改 end_time。
// 所以需要把“数据库里的旧值”和“请求里的新值”合并起来，再整体校验时间区间是否成立。
func (s *Service) UpdateActivity(id uint, updates map[string]any) (*model.Activity, error) {
	activity, err := s.GetActivity(id)
	if err != nil {
		return nil, err
	}

	startTime := activity.StartTime
	endTime := activity.EndTime
	if value, ok := updates["start_time"].(time.Time); ok {
		startTime = value
	}
	if value, ok := updates["end_time"].(time.Time); ok {
		endTime = value
	}
	if err := validateActivityWindow(startTime, endTime); err != nil {
		return nil, err
	}

	if err := mapWriteError(s.db.Model(activity).Updates(updates).Error); err != nil {
		return nil, err
	}
	return s.GetActivity(id)
}

// DeleteActivity 删除活动记录。
func (s *Service) DeleteActivity(id uint) error {
	return deleteByID[model.Activity](s.db, id)
}

// CreateFeeBill 创建会费单。
// 会费单依附于会员，所以写入前先检查 member_id 是否有效，
// 这样比让数据库直接报外键错误更容易给前端返回稳定提示。
func (s *Service) CreateFeeBill(fee *model.FeeBill) error {
	if err := s.ensureMemberExists(fee.MemberID); err != nil {
		return err
	}
	return mapWriteError(s.db.Create(fee).Error)
}

// ListFeeBills 返回会费单列表。
func (s *Service) ListFeeBills() ([]model.FeeBill, error) {
	var list []model.FeeBill
	if err := s.db.Order("id desc").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

// GetFeeBill 根据主键查询单个会费单。
func (s *Service) GetFeeBill(id uint) (*model.FeeBill, error) {
	return takeByID[model.FeeBill](s.db, id)
}

// UpdateFeeBill 更新会费单。
// 如果请求中修改了 member_id，就需要重新校验目标会员是否存在，
// 否则可能把会费单挂到一个无效会员上。
func (s *Service) UpdateFeeBill(id uint, updates map[string]any) (*model.FeeBill, error) {
	if memberID, ok := getUintUpdate(updates, "member_id"); ok {
		if err := s.ensureMemberExists(memberID); err != nil {
			return nil, err
		}
	}

	fee, err := s.GetFeeBill(id)
	if err != nil {
		return nil, err
	}
	if err := mapWriteError(s.db.Model(fee).Updates(updates).Error); err != nil {
		return nil, err
	}
	return s.GetFeeBill(id)
}

// DeleteFeeBill 删除会费单记录。
func (s *Service) DeleteFeeBill(id uint) error {
	return deleteByID[model.FeeBill](s.db, id)
}

// CreateNotice 创建公告记录。
// 公告本身没有复杂关联，所以这里只需要统一处理数据库写入错误即可。
func (s *Service) CreateNotice(notice *model.Notice) error {
	return mapWriteError(s.db.Create(notice).Error)
}

// ListNotices 返回公告列表。
func (s *Service) ListNotices() ([]model.Notice, error) {
	var list []model.Notice
	if err := s.db.Order("id desc").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

// GetNotice 根据主键查询单条公告。
func (s *Service) GetNotice(id uint) (*model.Notice, error) {
	return takeByID[model.Notice](s.db, id)
}

// UpdateNotice 更新公告内容，并在更新后返回数据库中的最新状态。
func (s *Service) UpdateNotice(id uint, updates map[string]any) (*model.Notice, error) {
	notice, err := s.GetNotice(id)
	if err != nil {
		return nil, err
	}
	if err := mapWriteError(s.db.Model(notice).Updates(updates).Error); err != nil {
		return nil, err
	}
	return s.GetNotice(id)
}

// DeleteNotice 删除公告记录。
func (s *Service) DeleteNotice(id uint) error {
	return deleteByID[model.Notice](s.db, id)
}

// ensureOrganizationExists 用于确认组织主键是否真实存在。
// 它的意义不是节省数据库查询，而是把“关联无效”明确收敛成业务错误，
// 让上层不需要理解底层外键异常的细节。
func (s *Service) ensureOrganizationExists(id uint) error {
	if _, err := s.GetOrganization(id); err != nil {
		return ErrInvalidReference
	}
	return nil
}

// ensureMemberExists 用于确认会员主键是否真实存在。
func (s *Service) ensureMemberExists(id uint) error {
	if _, err := s.GetMember(id); err != nil {
		return ErrInvalidReference
	}
	return nil
}

// ensureAdmin 用于初始化默认管理员账号。
// 这里的策略是“存在则跳过，不存在才创建”，这样既保证首次可登录，
// 也不会在每次启动时覆盖已有管理员密码。
func ensureAdmin(db *gorm.DB, username, password string) error {
	var cnt int64
	if err := db.Model(&model.User{}).Where("username = ?", username).Count(&cnt).Error; err != nil {
		return err
	}
	if cnt > 0 {
		return nil
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	return db.Create(&model.User{
		Username:     username,
		PasswordHash: string(hash),
		Role:         "admin",
	}).Error
}

// deleteByID 封装通用删除逻辑。
// 它统一处理三种结果：
// 1. 删除成功。
// 2. 因为外键依赖无法删除，返回 ErrDependencyExists。
// 3. 目标记录不存在，返回 ErrNotFound。
func deleteByID[T any](db *gorm.DB, id uint) error {
	result := db.Delete(new(T), id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrForeignKeyViolated) {
			return ErrDependencyExists
		}
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

// takeByID 封装通用主键查询逻辑。
// 这样每个资源的 GetXXX 方法都可以复用相同的“按主键查找 + 未找到映射”流程。
func takeByID[T any](db *gorm.DB, id uint) (*T, error) {
	var value T
	if err := db.First(&value, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &value, nil
}

// mapWriteError 把底层写入错误翻译成业务层错误。
// 当前主要处理重复键冲突和外键约束错误，其他未知错误则原样向上抛出，
// 由更上层记录日志并返回通用 500。
func mapWriteError(err error) error {
	switch {
	case err == nil:
		return nil
	case errors.Is(err, gorm.ErrDuplicatedKey):
		return ErrConflict
	case errors.Is(err, gorm.ErrForeignKeyViolated):
		return ErrInvalidReference
	default:
		return err
	}
}

// getUintUpdate 从更新字段 map 中提取 uint 类型值。
// 这个辅助函数的用途很单一：在更新前判断某个关联字段是否被修改，
// 如果被修改，再进一步做外键合法性校验。
func getUintUpdate(updates map[string]any, key string) (uint, bool) {
	value, ok := updates[key]
	if !ok {
		return 0, false
	}

	id, ok := value.(uint)
	return id, ok
}

// validateActivityWindow 校验活动时间区间是否合法。
// 当前规则很简单：只要开始和结束时间都存在，就不允许结束时间早于开始时间。
func validateActivityWindow(startTime, endTime time.Time) error {
	if !startTime.IsZero() && !endTime.IsZero() && endTime.Before(startTime) {
		return ErrInvalidState
	}
	return nil
}
