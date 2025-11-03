<template>
  <div>
    <el-row :gutter="[8, 8]">
      <el-col :span="24">
        <div class="dw-table-form">
          <el-form
            :inline="true"
            :model="listQuery"
            class="dw-form-inline"
            size="medium"
          >
            <el-form-item label="问卷标题">
              <el-input
                v-model="listQuery.surveyName"
                placeholder="请输入查询的问卷标题"
                clearable
              ></el-input>
            </el-form-item>
            <el-form-item label="问卷类型" style="margin-left: 12px">
              <el-select v-model="listQuery.surverType" clearable>
                <el-option label="内部问卷" value="1"></el-option>
                <el-option label="外部" value="2"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="问卷状态" style="margin-left: 12px">
              <el-select
                v-model="listQuery.surveyState"
                placeholder="请选择问卷状态"
                clearable
              >
                <el-option label="设计中" value="0"></el-option>
                <el-option label="未开始" value="1"></el-option>
                <el-option label="收集中" value="2"></el-option>
                <el-option label="收集结束" value="3"></el-option>
                <el-option label="停用" value="4"></el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="创建时间" style="margin-left: 12px">
              <el-date-picker
                v-model="dateValue"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="yyyy-MM-dd HH:mm:ss"
              >
              </el-date-picker>
            </el-form-item>

            <el-form-item>
              <el-button @click="onReset">重置</el-button>
              <el-button type="primary" @click="onSubmit">查询</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="dw-table">
          <div class="dw-table-title">
            <el-row
              :span="24"
              type="flex"
              justify="space-between"
              align="middle"
            >
              <el-col :span="4"><h3>我的问卷</h3></el-col>
              <el-col :span="20" style="text-align: right">
                <el-button
                  v-if="checkPermission('NEW_INTERNAL_QUESTIONNAIRE')"
                  type="primary"
                  size="medium"
                  @click="addInsideSurvey()"
                  >新建内部问卷</el-button
                >
                <el-button
                  v-if="checkPermission('NEW_EXTERNAL_QUESTIONNAIRE')"
                  type="primary"
                  size="medium"
                  @click="addExternalSurvey()"
                  >新建外部问卷</el-button
                >
              </el-col>
            </el-row>
          </div>
          <el-table :data="tableData" stripe style="width: 100%">
            <!-- <el-table-column label="id">
              <template slot-scope="{ row }">
                <span>{{ row.id }}</span>
              </template>
            </el-table-column> -->
            <el-table-column label="问卷标题">
              <template slot-scope="{ row }">
                <span>{{ row.surveyName }}</span>
              </template>
            </el-table-column>
            <el-table-column label="类型">
              <template slot-scope="{ row }">
                <span>{{ row.surveyType == 1 ? "内部问卷" : "外部问卷" }}</span>
              </template>
            </el-table-column>
            <el-table-column label="积分">
              <template slot-scope="{ row }">
                <span>{{ row.integral }}</span>
              </template>
            </el-table-column>
            <el-table-column label="有效时间">
              <template slot-scope="{ row }">
                <span>{{ row.startDate }} ~ {{ row.endDate }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态">
              <template slot-scope="{ row }">
                <el-tag v-if="row.surveyState === 0">设计中</el-tag>
                <el-tag v-else-if="row.surveyState === 1" type="success"
                  >未开始</el-tag
                >
                <el-tag v-else-if="row.surveyState === 2" type="info"
                  >收集中</el-tag
                >
                <el-tag v-else-if="row.surveyState === 3" type="info"
                  >收集结束</el-tag
                >
                <el-tag v-else-if="row.surveyState === 4" type="info"
                  >停用</el-tag
                >
                <el-tag v-else disable-transitions style="margin-left: 10px"
                  >未知</el-tag
                >
              </template>
            </el-table-column>

            <el-table-column label="答卷数" width="80">
              <template slot-scope="{ row }">
                <span>{{ row.answerNum || 0 }}&nbsp;份</span>
              </template>
            </el-table-column>
            <el-table-column label="创建人" width="80">
              <template slot-scope="{ row }">
                <span>{{ row.userName || 0 }}</span>
              </template>
            </el-table-column>

            <el-table-column label="创建时间" width="180">
              <template slot-scope="scope">
                <span>{{ scope.row.createDate }}</span>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="600" v-if="true">
              <template slot-scope="{ row }">
                <el-button-group>
                  <el-button
                    v-if="checkPermission('EDIT_QUESTIONNAIRE')"
                    type="primary"
                    class="buttonui"
                    size="mini"
                    @click="beforeEdit(row)"
                    >编辑</el-button
                  >
                  <el-button
                    v-if="row.surveyType == 1 && checkPermission('PREVIEW')"
                    size="mini"
                    class="buttonui"
                    type="primary"
                    @click="beforePreview(row)"
                    >预览</el-button
                  >
                  <el-button
                    v-if="row.surveyState === 0 && checkPermission('RELEASE')"
                    size="mini"
                    class="buttonui"
                    type="primary"
                    @click="beforePublish(row)"
                    >发布</el-button
                  >
                  <el-button
                    v-if="checkPermission('COPY_QUESTIONNAIRE')"
                    size="mini"
                    class="buttonui"
                    type="primary"
                    @click="beforeCopy(row)"
                    >复制</el-button
                  >
                  <el-button
                    v-if="checkPermission('VIEW_RESPONSE_RECORD')"
                    size="mini"
                    class="buttonui"
                    type="primary"
                    @click="goRecordPage(row)"
                    >答卷记录</el-button
                  >
                  <el-button
                    v-if="
                      row.surveyType == 1 && checkPermission('DATA_STATISTICS')
                    "
                    size="mini"
                    class="buttonui"
                    type="primary"
                    @click="viewDataTotal(row)"
                    >数据统计</el-button
                  >

                  <el-button
                    v-if="checkPermission('DELETE_QUESTIONNAIRE')"
                    size="mini"
                    class="buttonui"
                    type="danger"
                    @click="beforeDel(row)"
                    >删除</el-button
                  >
                  <el-button
                    v-if="
                      row.surveyState != 3 &&
                      checkPermission('END_QUESTIONNAIRE')
                    "
                    size="mini"
                    class="buttonui"
                    type="danger"
                    @click="beforeEnd(row)"
                    >结束问卷</el-button
                  >
                  <el-button
                    v-if="
                      row.surveyState == 2 &&
                      checkPermission('DISABLE_QUESTIONNAIRE')
                    "
                    size="mini"
                    class="buttonui"
                    type="danger"
                    @click="beforeStop(row)"
                    >停用</el-button
                  >
                  <el-button
                    v-if="
                      row.surveyState == 4 &&
                      checkPermission('ENABLE_QUESTIONNAIRE')
                    "
                    size="mini"
                    class="buttonui"
                    type="success"
                    @click="beforeStart(row)"
                    >启用</el-button
                  >
                  <el-button
                    v-if="
                      row.surveyType == 1 && checkPermission('EXPORT_EXCELE')
                    "
                    size="mini"
                    class="buttonui"
                    type="success"
                    @click="handleExportExcel(row)"
                    >导出</el-button
                  >
                </el-button-group>
              </template>
            </el-table-column>
          </el-table>
          <div class="dw-pagination">
            <el-pagination
              :page-size="listQuery.pageSize"
              :current-page="listQuery.current"
              :total="total"
              background
              layout="prev, pager, next"
              @current-change="handleCurrentChange"
            >
            </el-pagination>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-dialog
      :title="`${externalForm.id ? '编辑外部问卷' : '创建外部问卷'}`"
      :visible.sync="showObj.external"
      :close-on-click-modal="false"
      append-to-body
      width="600px"
    >
      <el-form :model="externalForm">
        <el-form-item :label-width="formLabelWidth" required label="问卷标题">
          <el-input
            v-model="externalForm.surveyName"
            autocomplete="off"
          ></el-input>
        </el-form-item>
        <el-form-item :label-width="formLabelWidth" required label="问卷地址">
          <el-input
            v-model="externalForm.surveyAddress"
            autocomplete="off"
          ></el-input>
        </el-form-item>
        <el-form-item :label-width="formLabelWidth" required label="有效时间">
          <el-date-picker
            v-model="validityDateValue"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd HH:mm:ss"
          >
          </el-date-picker>
        </el-form-item>
        <el-form-item :label-width="formLabelWidth" required label="问卷积分">
          <el-input
            v-model="externalForm.integral"
            autocomplete="off"
          ></el-input>
        </el-form-item>
        <el-form-item :label-width="formLabelWidth" required label="参与人">
          <el-select
            v-model="externalForm.userIdList"
            multiple
            placeholder="请选择"
          >
            <el-option
              v-for="item in userList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
            </el-option>
          </el-select>

          <el-button @click="externalDialogVisible = true">选择会员</el-button>
          <!-- 外部问卷的弹窗 -->
          <SelectUser
            v-if="externalDialogVisible"
            :dialogFormUserList="externalDialogVisible"
            :ids="externalForm.userIdList"
            :leibie="'外部问卷'"
            @changenter="ChuanenterSelect"
            @closedialog="handleDialogCloseselectuser"
          ></SelectUser>
        </el-form-item>
        <el-form-item :label-width="formLabelWidth" label="问卷描述">
          <el-input
            v-model="externalForm.surveyNameText"
            autocomplete="off"
          ></el-input>
        </el-form-item>
        <el-form-item :label-width="formLabelWidth" required label="流程说明">
          <el-input
            type="textarea"
            v-model="externalForm.workflowRemark"
            :autosize="{ minRows: 2, maxRows: 20 }"
            autocomplete="off"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="showObj.external = false">取 消</el-button>
        <el-button type="primary" @click="handleExternal">确 定</el-button>
      </div>
    </el-dialog>

    <el-dialog
      :title="`${insideForm.id ? '编辑内部问卷' : '创建内部问卷'}`"
      :visible.sync="showObj.inside"
      :close-on-click-modal="false"
      append-to-body
      width="600px"
    >
      <el-form :model="insideForm">
        <el-form-item :label-width="formLabelWidth" required label="问卷标题">
          <el-input
            v-model="insideForm.surveyName"
            autocomplete="off"
          ></el-input>
        </el-form-item>
        <el-form-item :label-width="formLabelWidth" required label="有效时间">
          <el-date-picker
            v-model="validityDateValue"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd HH:mm:ss"
          >
          </el-date-picker>
        </el-form-item>
        <el-form-item :label-width="formLabelWidth" required label="问卷积分">
          <el-input v-model="insideForm.integral" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item :label-width="formLabelWidth" required label="参与人">
          <el-select
            v-model="insideForm.userIdList"
            multiple
            placeholder="请选择"
          >
            <el-option
              v-for="item in userList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
          <el-button @click="dialogFormUserList = true">选择会员</el-button>
          <SelectUser
            v-if="dialogFormUserList"
            :dialogFormUserList="dialogFormUserList"
            :ids="insideForm.userIdList"
            :leibie="'内部问卷'"
            @change="ChuanSelect"
            @close-dialog="handleDialogClose"
          ></SelectUser>
        </el-form-item>
        <el-form-item :label-width="formLabelWidth" label="问卷描述">
          <el-input
            v-model="insideForm.surveyNameText"
            autocomplete="off"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="showObj.inside = false">取 消</el-button>
        <el-button
          v-if="insideForm.id"
          type="primary"
          @click="handleInside(false)"
          >确 定</el-button
        >
        <el-button type="primary" @click="handleInside">下一步</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  dwSurveyCopy,
  dwSurveyCreate,
  dwSurveyDelete,
  dwSurveyInfo,
  dwSurveyList,
  endSurveyApi,
  getUserListApi,
  publishDwSurvey,
  startSurveyApi,
  stopSurveyApi,
  updateDwSurveyInfo,
  updateSurveyApi,
} from "@/api/dw-survey";
import auth from "@/utils/dw-authorized.js";
import * as XLSX from "xlsx";
import { exportExcelApi } from "../../api/dw-survey";
import SelectUser from "../../components/common/SelectUser.vue";
export default {
  name: "SurveyList",
  components: {
    SelectUser,
  },

  data() {
    return {
      dateValue: [],
      tableData: [],

      total: 0,
      dialogTitle: "创建问卷",
      listQuery: {
        pageSize: 10,
        current: 1,
        surveyName: null,
        surveyState: null,
        surverType: null,
        startTime: null,
        endTime: null,
      },
      dialogFormUserList: false,
      dialogFormVisible: false,
      externalDialogVisible: false,
      form: {
        name: "",
        id: null,
      },
      formLabelWidth: "120px",
      showObj: {
        external: false,
        inside: false,
      },
      externalForm: {
        surveyName: null,
        surveyType: 2,
        startDate: null,
        endDate: null,
        surveyNameText: null,
        workflowRemark: null,
        surveyAddress: null,
        integral: null,
        userIdList: [],
      },
      insideForm: {
        surveyName: null,
        surveyType: 1,
        startDate: null,
        endDate: null,
        surveyNameText: null,
        integral: null,
        userIdList: [],
      },
      validityDateValue: [],
      userList: [],
    };
  },
  mounted() {
    this.getUserList();
    this.queryList();
  },
  methods: {
    generateExcelFile(data) {
      try {
        // 使用命名空间或解构的方式
        const wb = XLSX.utils.book_new();

        const allData = [
          ["问卷信息:", ""],
          ["问卷ID", data.id],
          ["问卷名称", data.surveyName],
          ["题目数量", data.surveyQuNum],
          ["回收数量", data.answerNum],
          ["问卷积分", data.integral],
          ["开始时间", data.startDate],
          ["结束时间", data.endDate],
          [],
          ["回访数据："],
          ...(data.dataList || []).map((row) =>
            row.map((cell) =>
              typeof cell === "string"
                ? cell.replace(/\n/g, " ").replace(/;/g, "；")
                : cell
            )
          ),
        ];

        const ws = XLSX.utils.aoa_to_sheet(allData);

        // 设置列宽
        ws["!cols"] = [
          { wch: 12 },
          { wch: 30 },
          ...(data.dataList[0].slice(2).map(() => ({ wch: 15 })) || []),
        ];

        // 合并单元格
        ws["!merges"] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
          {
            s: { r: 9, c: 0 },
            e: { r: 9, c: Math.max(1, (data.dataList[0].length || 2) - 1) },
          },
        ];

        XLSX.utils.book_append_sheet(wb, ws, "问卷数据");

        // 生成安全文件名
        const safeName = (data.surveyName || "未命名问卷")
          .replace(/[\\/:*?"<>|]/g, "")
          .substring(0, 50);

        XLSX.writeFile(wb, `${safeName}_导出数据.xlsx`);
      } catch (error) {
        console.error("导出失败:", error);
        throw new Error(`导出过程中出错: ${error.message}`);
      }
    },

    async handleExportExcel(row) {
      try {
        const response = await exportExcelApi(row.id);
        console.log("接口返回数据:", response.data.data.dataList);
        this.generateExcelFile(response.data.data);
        this.$message.success("导出成功");
      } catch (error) {
        console.error("导出失败:", error);
        this.$message.error("导出失败: " + (error.message || error));
      }
    },

    checkPermission(permission) {
      return auth.hasPermission(permission);
    },
    async getUserList() {
      const res = await getUserListApi();
      if (res.data.data.rows) {
        this.userList = res.data.data.rows.map((item) => {
          return {
            value: item.id,
            label: item.id,
          };
        });
      }
    },

    addInsideSurvey(row) {
      const addRow = {
        surveyName: null,
        surveyType: 1,
        startDate: null,
        endDate: null,
        surveyNameText: "非常感谢您的参与！如有涉及个人信息，我们将严格保密。",
        integral: null,
        userIdList: [],
      };

      this.insideForm = row || addRow;
      this.validityDateValue = row ? [row.startDate, row.endDate] : [];
      this.showObj.inside = true;
    },
    addExternalSurvey(row) {
      const addRow = {
        surveyName: null,
        surveyType: 2,
        startDate: null,
        endDate: null,
        surveyNameText: "非常感谢您的参与！如有涉及个人信息，我们将严格保密。",
        workflowRemark: `此问卷为外部问卷，流程如下：
1. 复制问卷到浏览器进行打开并作答。
2. 作答完成后需要把作答的相关页面截图上传。
3. 审核上传问卷的截图通过后，获取积分。`,
        surveyAddress: null,
        integral: null,
        userIdList: [],
      };

      this.externalForm = row || addRow;
      this.validityDateValue = row ? [row.startDate, row.endDate] : [];
      this.showObj.external = true;
    },

    async handleExternal() {
      const { surveyName, surveyAddress, integral, userIdList } =
        this.externalForm;
      const [startDate, endDate] = this.validityDateValue || [null, null];

      if (!surveyName || surveyName.trim() === "") {
        this.$message({
          message: "问卷标题不能为空",
          type: "warning",
        });

        return;
      }
      if (!surveyAddress || surveyAddress.trim() === "") {
        this.$message({
          message: "问卷地址不能为空",
          type: "warning",
        });

        return;
      }
      if (!startDate || !endDate) {
        this.$message({
          message: "请设置有效时间",
          type: "warning",
        });

        return;
      }
      if (!integral) {
        this.$message({
          message: "问卷积分不能为空",
          type: "warning",
        });

        return;
      }
      if (userIdList.length === 0) {
        this.$message({
          message: "参与人不能为空",
          type: "warning",
        });

        return;
      }

      const query = {
        ...this.externalForm,
        startDate,
        endDate,
      };

      const api = query.id ? updateDwSurveyInfo : dwSurveyCreate;

      const res = await api(query);
      if (res.data.resultCode === 200) {
        this.$message({
          message: "问卷创建成功",
          type: "success",
        });
        this.showObj.external = false;
        this.queryList();
      } else {
        this.$message({
          message: res.data.resultMsg,
          type: "error",
        });
      }
    },
    async handleInside(hasNextStep = true) {
      const { surveyName, integral, userIdList } = this.insideForm;
      const [startDate, endDate] = this.validityDateValue || [null, null];

      if (!surveyName || surveyName.trim() === "") {
        this.$message({
          message: "问卷标题不能为空",
          type: "warning",
        });

        return;
      }

      if (!startDate || !endDate) {
        this.$message({
          message: "请设置有效时间",
          type: "warning",
        });

        return;
      }
      if (!integral) {
        this.$message({
          message: "问卷积分不能为空",
          type: "warning",
        });

        return;
      }
      if (userIdList.length === 0) {
        this.$message({
          message: "参与人不能为空",
          type: "warning",
        });

        return;
      }

      const query = {
        ...this.insideForm,
        startDate,
        endDate,
      };

      let api;

      if (query.id) {
        api = hasNextStep ? updateSurveyApi : updateDwSurveyInfo;
      } else {
        api = dwSurveyCreate;
      }

      const res = await api(query);
      if (res.data.resultCode === 200) {
        if (!hasNextStep) {
          this.$message({
            message: "操作成功",
            type: "success",
          });
          this.showObj.inside = false;
          this.queryList();
          return;
        }

        let id;

        if (!query.id) {
          const res = await dwSurveyList({ pageSize: 1, current: 1 });
          id = res.data.data[0].id;
        } else {
          id = query.id;
        }

        if (!query.id) {
          // 新增直接跳转到问卷设计页
          window.location.href = `${process.env.DW_WEB_PREFIX}/static/diaowen/design.html?surveyId=${id}`;
        } else {
          const action = await this.$confirm(
            "已提交问卷会同步更新为最新问卷数据并重新推送给会员，确认编辑吗?",
            "提示",
            {
              confirmButtonText: "确定",
              cancelButtonText: "取消",
              type: "warning",
            }
          );
          if (action === "confirm") {
            window.location.href = `${process.env.DW_WEB_PREFIX}/static/diaowen/design.html?surveyId=${id}`;
          }
        }
      } else {
        this.$message({
          message: res.data.resultMsg,
          type: "error",
        });
      }
    },

    async beforeEdit(row) {
      const res = await dwSurveyInfo(row.id);
      console.log("res---", res);
      const answerUserList = res.data.data.answerUserList || [];
      const userIdList = answerUserList.map((item) => item.answerUserId);
      if (row.surveyType == 2) {
        this.addExternalSurvey({ ...row, userIdList });
      } else {
        this.addInsideSurvey({ ...row, userIdList });
      }
      console.log(row);
    },
    beforePreview(row) {
      window.location.href = `${process.env.DW_WEB_PREFIX}/static/diaowen/preview.html?surveyId=${row.id}`;
    },
    async beforeCopy(row) {
      const action = await this.$confirm("确定复制吗?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      });
      if (action === "confirm") {
        const res = await dwSurveyCopy(row.id, row.surveyName);
        if (res.data.resultCode === 200) {
          this.$message({
            message: "问卷复制成功",
            type: "success",
          });
          this.queryList();
        }
      }
    },
    //对话框
    handleDialogClose() {
      this.dialogFormUserList = false;
    },
    handleDialogCloseselectuser() {
      this.externalDialogVisible = false;
    },
    ChuanSelect(selectlist) {
      this.insideForm.userIdList = selectlist;
    },
    ChuanenterSelect(selectlist) {
      this.externalForm.userIdList = selectlist;
    },
    handleSelectVisibleChange() {
      this.dialogFormUserList = true;
    },

    viewDataTotal(row) {
      this.$router.push({
        path: `/no-top/dw/survey/d/chart/${row.id}`,
        query: {
          sid: row.id,
        },
      });
    },
    async beforeDel(row) {
      const action = await this.$confirm("确定删除吗?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      });
      if (action === "confirm") {
        const data = { id: [row.id] };
        const res = await dwSurveyDelete(data);
        if (res.data.resultCode === 200) {
          this.$message({
            message: "操作成功",
            type: "success",
          });
          this.queryList();
        } else {
          this.$message.error("删除问卷失败");
        }
      }
    },
    async beforeEnd(row) {
      const action = await this.$confirm("确定结束问卷吗?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      });
      if (action === "confirm") {
        const data = { id: row.id };
        const res = await endSurveyApi(data);
        if (res.data.resultCode === 200) {
          this.$message({
            message: "操作成功",
            type: "success",
          });
          this.queryList();
        } else {
          this.$message.error("操作失败");
        }
      }
    },
    async beforeStop(row) {
      const action = await this.$confirm("确定停用问卷吗?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      });
      if (action === "confirm") {
        const data = { id: row.id };
        const res = await stopSurveyApi(data);
        if (res.data.resultCode === 200) {
          this.$message({
            message: "操作成功",
            type: "success",
          });
          this.queryList();
        } else {
          this.$message.error("操作失败");
        }
      }
    },
    async beforeStart(row) {
      const action = await this.$confirm("确定启用问卷吗?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      });
      if (action === "confirm") {
        const data = { id: row.id };
        const res = await startSurveyApi(data);
        if (res.data.resultCode === 200) {
          this.$message({
            message: "操作成功",
            type: "success",
          });
          this.queryList();
        } else {
          this.$message.error("操作失败");
        }
      }
    },
    async beforePublish(row) {
      const action = await this.$confirm("确定发布问卷吗?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      });
      if (action === "confirm") {
        const data = { surveyId: row.id };
        const res = await publishDwSurvey(data);
        if (res.data.resultCode === 200) {
          this.$message({
            message: "操作成功",
            type: "success",
          });
          this.queryList();
        } else {
          this.$message.error("操作失败");
        }
      }
    },

    goRecordPage(row) {
      window.parent.postMessage(
        {
          type: "JUMP_ANSWER_LIST",
          surveyName: row.surveyName,
        },
        `${process.env.DW_GUNS_ADMIN_WEB_URL}`
      ); // 注意：这里要改成项目A实际部署的域名
    },

    buttonClickA(href) {
      window.location.href = `${process.env.DW_WEB_PREFIX}${href}`;
    },
    handlePush: function (to) {
      this.$router.push(to);
    },
    handleCopy(index, row) {
      console.log(index, row);
      this.form.id = row.id;
      if (row.surveyNameText !== undefined && row.surveyNameText !== null) {
        this.form.name = `${row.surveyNameText}`;
      } else {
        this.form.name = `复制问卷标题`;
      }
      this.dialogFormVisible = true;
      this.dialogTitle = "复制问卷";
    },
    handleDelete(index, row) {
      this.$msgbox
        .confirm("确认删除此问卷吗？", "删除警告", {
          type: "warning",
          confirmButtonText: "确认删除",
        })
        .then(() => {
          const data = { id: [row.id] };
          dwSurveyDelete(data).then((response) => {
            console.log(response);
            const httpResult = response.data;
            if (httpResult.resultCode === 200) {
              this.$message.success("删除成功，即将刷新数据。");
              this.queryList(1);
            } else {
              this.$message.error("删除问卷失败");
            }
          });
        })
        .catch(() => {});
    },

    onSubmit() {
      this.listQuery.current = 1;
      this.queryList(1);
    },

    onReset() {
      this.listQuery = {
        pageSize: 10,
        current: 1,
        surveyName: null,
        surveyState: null,
        surverType: null,
        startTime: null,
        endTime: null,
      };
      this.dateValue = [];
      this.queryList();
    },

    handleCurrentChange(val) {
      this.listQuery.current = val;
      this.queryList();
    },
    queryList() {
      const query = {
        ...this.listQuery,
        startTime: this.dateValue.length ? this.dateValue[0] : null,
        endTime: this.dateValue.length ? this.dateValue[1] : null,
      };
      console.log("输入数据内容----------", query);
      dwSurveyList(query).then((response) => {
        const resultData = response.data.data;
        this.tableData = resultData;
        this.total = response.data.total;
        console.log("分页数据内容-----------------", resultData);
        // this.current = response.data.current;
        // this.pageSize = response.data.pageSize;
      });
    },
    handleDialogConfirm() {
      if (this.form.id === null) {
        this.createSurvey();
      } else {
        this.copySurvey(this.form.id);
      }
    },
    createSurvey() {
      const data = { surveyName: this.form.name };
      dwSurveyCreate(data).then((response) => {
        const httpResult = response.data;
        const resultData = httpResult.data;
        if (httpResult.resultCode === 200) {
          this.dialogFormVisible = false;
          this.$confirm(
            "问卷创建成功，点击“继续编辑问卷”进入问卷编辑。",
            "系统提示",
            { confirmButtonText: "继续编辑问卷" }
          )
            .then(({ value }) => {
              window.location.href = `${process.env.DW_WEB_PREFIX}/static/diaowen/design.html?surveyId=${resultData.id}`;
            })
            .catch(() => {
              this.queryList(1);
            });
        } else {
          this.$message.error("创建问卷失败");
        }
      });
    },
    copySurvey(surveyId) {
      dwSurveyCopy(surveyId, this.form.name).then((response) => {
        const httpResult = response.data;
        const resultData = httpResult.data;
        if (httpResult.resultCode === 200) {
          this.dialogFormVisible = false;
          this.$confirm(
            "问卷复制成功，点击“继续编辑问卷”进入问卷编辑。",
            "系统提示",
            { confirmButtonText: "继续编辑问卷" }
          )
            .then(({ value }) => {
              window.location.href = `${process.env.DW_WEB_PREFIX}/static/diaowen/design.html?surveyId=${resultData.id}`;
            })
            .catch(() => {
              this.queryList(1);
            });
        } else {
          this.$message.error("问卷复制失败");
        }
      });
    },
  },
};
</script>
<style scoped>
.dw-table-form {
  background-color: white;
  padding: 20px;
  margin-bottom: 20px;
}
.dw-table {
  background: white;
  padding: 20px;
}
.dw-table .dw-table-title {
  padding-bottom: 20px;
  border-bottom: 1px solid #f3f3f3;
}
.dw-table .dw-table-title h3 {
  padding: 0px;
  margin: 0px;
}
.dw-pagination {
  padding-top: 20px;
  text-align: right;
}
.el-button--mini {
  font-size: 14px !important;
}
.buttonui {
  font-size: 14px !important;
  margin-right: 8px !important;
  border-radius: 0 !important;
  margin-top: 3px;
}
</style>
