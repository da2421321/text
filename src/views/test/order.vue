<template>
  <div class="guns-layout">
    <div class="guns-layout-content">
      <div class="guns-layout">
        <div class="guns-layout-content-application">
          <div class="content-mian">
            <div class="content-mian-header">
              <div class="header-content">
                <a-space :size="16">
                  <a-select v-model:value="where.status" class="w-350px" placeholder="请选择审核状态" @change="reload">
                    <a-select-option v-for="(value, key) in statusObj" :key="key" :value="key">{{ value }}</a-select-option>
                  </a-select>
                  <a-input
                    v-model:value="where.technicianName"
                    placeholder="请输入技师昵称"
                    class="search-input w-350px!"
                    allow-clear
                    @pressEnter="reload"
                  ></a-input>
                  <a-input
                    v-model:value="where.customerName"
                    placeholder="请输入客户昵称"
                    class="search-input w-350px!"
                    allow-clear
                    @pressEnter="reload"
                  ></a-input>
                  <a-button class="border-radius" @click="clear">重置</a-button>
                   <a-button class="border-radius" @click="modalVisible = true">创建订单</a-button>
                </a-space>
              </div>
            </div>
            <div class="content-mian-body">
              <div class="table-content">
                <common-table :columns="columns" :where="where" rowId="id" ref="tableRef" url="/order/queryPage" methods="post">
                  <template #bodyCell="{ column, record }">
                    <!-- 操作 -->
                    <template v-if="column.key == 'action'">
                      <a-space :size="16">
                        <a-button type="link" @click="viewItem(record.id)">查看详情</a-button>
                      </a-space>
                    </template>
                  </template>
                </common-table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <popup v-model="visible">
      <div class="order-detail w-1200px">
        <div class="w-full bg-[#ffffff] rounded-[8px] p-20px">
          <div class="w-full flex justify-between">
            <div>
              <p>{{ statusObj[detail.status] }}</p>
              <p class="text-[#999999]">订单号: {{ detail.id }}</p>
            </div>
            <div>
              <p class="text-[#999999]">下单时间: {{ detail.createTime }}</p>
              <p class="text-[#999999]">预约时间: {{ detail.reserveTime }}</p>
              <a-button type="primary" size="small" @click="openModal(1)" v-if="detail.status == 1">修改预约时间</a-button>
            </div>
          </div>
          <div class="w-full font-bold">客户信息</div>
          <div class="w-full flex mt-10px">
            <a-avatar :src="detail.customerImg" :size="80" />
            <div class="ml-20px">
              <div class="flex items-center">
                <div class="text-[20px] font-bold">{{ detail.customerName }}</div>
                <div class="text-[#d9ab48] p-4px bg-[#fcf7e6] ml-10px rounded-[4px]">{{ detail.customerLevel }}</div>
                <div
                  class="text-[#779ff3] p-4px bg-[#ebf2fe] ml-10px rounded-[4px]"
                  v-for="(item, index) in detail.customerTags.split(',')"
                  :key="index"
                  v-if="detail.customerTags"
                >
                  {{ item }}
                </div>
              </div>
              <div class="text-[#999999]">客户ID: {{ detail.customerId }}</div>
            </div>
          </div>
          <div class="w-full font-bold mt-10px">服务信息</div>
          <a-form>
            <a-row>
              <a-col :span="8">
                <a-form-item label="服装名称">{{ detail.serviceName }}</a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="服装分类">{{ detail.serviceCatName }}</a-form-item>
              </a-col>
            </a-row>
            <a-form-item label="服装图片">
              <a-image :width="200" :src="detail.serviceImg" />
            </a-form-item>
          </a-form>
          <div class="w-full font-bold mt-10px">服务项目</div>
          <a-form>
            <common-table :columns="itemsColumns" rowId="id">
              <template #bodyCell="{ column, record }">
                <!-- 操作 -->
                <template v-if="column.key == 'action'">
                  <a-space :size="16">
                    <a-button type="link" @click="deleteItem(record.id)">删除</a-button>
                  </a-space>
                </template>
              </template>
            </common-table>
          </a-form>
        </div>
        <!-- 客房 -->
        <div class="w-full bg-[#ffffff] rounded-[8px] p-20px mt-10px">
          <div class="w-full font-bold mt-10px">选择客房</div>
          <a-form>
            <div style="display: flex">
              <a-select size="large" ref="select" v-model:value="value1" style="width: 90%">
                <a-select-option value="jack">Jack</a-select-option>
                <a-select-option value="lucy">Lucy</a-select-option>
                <a-select-option value="disabled" disabled>Disabled</a-select-option>
                <a-select-option value="Yiminghe">yiminghe</a-select-option>
              </a-select>
              <a-button type="primary" @click="addchange" style="margin-left: 20px">添加客房</a-button>
            </div>
            <div
              style="
                height: 60px;
                margin-top: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background-color: #f4f4f4;
              "
            >
              <div style="padding-left: 10px">
                <div>vip豪华套房</div>
                <div>空闲</div>
              </div>
              <a-button>删除</a-button>
            </div>
          </a-form>
        </div>
        <!-- 服装 -->
        <div class="w-full bg-[#ffffff] rounded-[8px] p-20px mt-10px">
          <div class="w-full font-bold mt-10px">选择客房</div>
          <a-form>
            <div style="display: flex">
              <a-select size="large" ref="select" v-model:value="value1" style="width: 90%">
                <a-select-option value="jack">Jack</a-select-option>
                <a-select-option value="lucy">Lucy</a-select-option>
                <a-select-option value="disabled" disabled>Disabled</a-select-option>
                <a-select-option value="Yiminghe">yiminghe</a-select-option>
              </a-select>
              <a-button type="primary" @click="addchange" style="margin-left: 20px">添加客房</a-button>
            </div>
            <div
              style="
                height: 60px;
                margin-top: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background-color: #f4f4f4;
              "
            >
              <div style="padding-left: 10px">
                <div>vip豪华套房</div>
                <div>空闲</div>
              </div>
              <a-button>删除</a-button>
            </div>
          </a-form>
        </div>
        <!-- 付款信息 -->
        <div class="w-full bg-[#ffffff] rounded-[8px] p-20px mt-10px">
          <div class="w-full font-bold">付款信息</div>
          <a-list>
            <a-list-item
              >订单总金额
              <template #extra>
                <span style="color: #52c41a">¥ 50.00</span>
              </template>
            </a-list-item>
            <a-list-item>
              <div class="flex flex-col gap-1">
                <div>现金支付</div>
                <div class="w-full border-t border-gray-300"></div>
                <div>储值支付</div>
              </div>
              <template #extra>
                <div class="flex flex-col gap-1 items-end">
                  <span style="color: #52c41a">¥ 30.00</span>
                  <span style="color: #52c41a">¥ 20.00</span>
                </div>
              </template>
            </a-list-item>

            <a-list-item>
              <span class="font-bold">实付金额</span>
              <template #extra>
                <span style="color: #52c41a">¥ 50.00</span>
              </template>
            </a-list-item>
          </a-list>
        </div>
        <!-- 订单评价 -->
        <div class="w-full bg-[#ffffff] rounded-[8px] p-20px mt-10px">
          <div class="w-full font-bold">订单评价</div>
          <a-list item-layout="horizontal" :data-source="data">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #title>
                    <div class="flex flex-col">
                      <a href="https://www.antdv.com/">{{ item.title }}</a>
                      <a-rate v-model:value="value" allow-half />
                      <div class="text-gray-600">
                        {{ item.content || '用户未填写评价内容' }}
                      </div>
                    </div>
                  </template>
                  <template #avatar>
                    <a-avatar src="https://joeschmoe.io/api/v1/random" />
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </div>
        <!-- 技师信息 -->
        <!-- <div class="w-full bg-[#ffffff] rounded-[8px] p-20px mt-10px">
          <div class="w-full font-bold flex justify-between items-center">
            <span>技师信息</span>
            <a-button type="primary" @click="openModal(0)" v-if="detail.status == 1">切换技师</a-button>
          </div>
          <div class="w-full flex mt-10px">
            <a-avatar :src="detail.technicianImg" :size="80" />
            <div class="ml-20px">
              <div class="flex items-center">
                <div class="text-[20px] font-bold">{{ detail.technicianName }}</div>
                <div class="text-[#9b96f0] p-4px bg-[#edecfc] ml-10px rounded-[4px]">高级技师</div>
              </div>
              <div class="flex items-center">
                <StarFilled class="mr-4px" style="color: #facc15" />{{ detail.srvScore }} |
                <span class="text-[#999999] ml-4px">服务 {{ detail.srvCnt }} 次</span>
              </div>
              <div class="text-[#999999]">巴拉巴拉小魔仙</div>
            </div>
          </div>
        </div> -->
        <div class="w-full bg-[#ffffff] rounded-[8px] p-20px mt-10px" v-if="detail.status == 3 && detail.evaluateStatus == 1">
          <div class="w-full font-bold">订单评价</div>
          <div class="w-full flex mt-10px">
            <a-avatar :src="detail.customerImg" :size="60" />
            <div class="flex-1 ml-20px">
              <div class="flex justify-between items-center">
                <div class="text-20px font-bold">{{ detail.customerName }}</div>
                <div class="text-#999999 text-16px">
                  {{ detail.evaluateTime }} <DeleteFilled style="color: #ff0000" @click="deleteOrderEvaluate" />
                </div>
              </div>
              <div class="flex items-center">
                <StarFilled class="mr-4px" style="color: #facc15" v-for="(item, index) in detail.evaluateScore" :key="index" />
              </div>
              <div class="text-[#999999]">{{ detail.evaluateContent }}</div>
            </div>
          </div>
        </div>
        <div class="w-full mt-10px flex justify-end items-center" v-if="isSuperAdmin == 0">
          <a-button v-if="detail.status == 1 || detail.status == 2" @click="cancel">取消订单</a-button>
          <a-button class="ml-10px" type="primary" v-if="detail.status == 1" @click="confirm">接受订单</a-button>
          <a-button class="ml-10px" type="primary" v-if="detail.status == 2" @click="finish">确认完成订单</a-button>
        </div>
      </div>
    </popup>
    <a-modal v-model:visible="techModal" title="请选择更换的技师" @ok="update">
      <a-select v-model:value="detail.technicianId" class="w-full" v-if="isChangeTech">
        <a-select-option :value="item.id" v-for="(item, index) in techList" :key="index">{{ item.petName }}</a-select-option>
      </a-select>
      <a-date-picker show-time placeholder="请选择预约时间" @change="onChange" v-else />
    </a-modal>
    <a-modal v-model:visible="modalVisible" title="创建订单" @ok="createOrder">
      
    </a-modal>
  </div>
</template>

<script setup>
import { Modal, message } from 'ant-design-vue';
import { onBeforeMount, onMounted, ref } from 'vue';
import { cancelOrder, confirmOrder, deleteEvaluate, finishOrder, getBsTechList, getDetail, updateOrder } from '../api/index';
import popup from '../components/popup.vue';
const isSuperAdmin = ref(false);
onBeforeMount(() => {
  isSuperAdmin.value = Number(localStorage.getItem('superAdminFlag'));
});
onMounted(() => {
  bsTechList();
});
const statusObj = {
  1: '待确认',
  2: '待服务',
  3: '已完成',
  4: '客户取消预约'
};
const visible = ref(false);
const techModal = ref(false);
const where = ref({
  status: null,
  technicianName: '',
  customerName: '',
  startReserveDate: '',
  endReserveDate: ''
});

// 表格配置
const columns = ref([
  {
    dataIndex: 'id',
    title: '序号',
    isShow: true,
    customRender: ({ index }) => index + 1
  },
  {
    dataIndex: 'id',
    title: '订单ID',
    isShow: true
  },
  {
    dataIndex: 'customerId',
    title: '客户ID',
    isShow: true
  },
  {
    dataIndex: 'customerName',
    title: '客户昵称',
    isShow: true
  },
  {
    dataIndex: 'status',
    title: '状态',
    isShow: true,
    customRender: ({ text }) => statusObj[text]
  },
  {
    dataIndex: 'technicianName',
    title: '技师昵称',
    isShow: true
  },
  {
    dataIndex: 'shopName',
    title: '门店名称',
    isShow: true
  },
  {
    dataIndex: 'createTime',
    title: '下单时间',
    isShow: true
  },
  {
    dataIndex: 'reserveTime',
    title: '预约时间',
    isShow: true
  },
  {
    dataIndex: 'reserveTime',
    title: '订单金额',
    isShow: true
  },
  {
    dataIndex: 'reserveTime',
    title: '付款类型',
    isShow: true
  },
  {
    key: 'action',
    title: '操作',
    width: 100,
    fixed: 'right',
    isShow: true
  }
]);
const itemsColumns = ref([
  {
    dataIndex: 'id',
    title: '序号',
    isShow: false,
    customRender: ({ index }) => index + 1
  },
  {
    dataIndex: 'id',
    title: '项目名称',
    isShow: true
  },
  {
    dataIndex: 'id',
    title: '服务类型',
    isShow: true
  },
  {
    dataIndex: 'id',
    title: '技师',
    isShow: true
  },
  {
    dataIndex: 'id',
    title: '服务时长',
    isShow: true
  },
  {
    dataIndex: 'id',
    title: '价格',
    isShow: true
  },
  {
    key: 'action',
    dataIndex: 'id',
    title: '操作',
    isShow: true
  }
]);
// ref
const tableRef = ref(null);
// 点击搜索
const reload = () => {
  tableRef.value.reload();
};
// 清除搜索条件
const clear = () => {
  where.value = {
    status: null,
    technicianName: '',
    customerName: '',
    startReserveDate: '',
    endReserveDate: ''
  };
  reload();
};

const detail = ref({});
const detailId = ref('');
// 查看
const viewItem = async id => {
  detailId.value = id;
  let { success, data } = await getDetail({ id });
  if (success) {
    detail.value = data;
    visible.value = true;
  }
};
// 确认订单
const confirm = async () => {
  let { success } = await confirmOrder({ id: detail.value.id });
  if (success) {
    viewItem(detailId.value);
  }
};
// 确认订单
const cancel = async () => {
  let { success } = await cancelOrder({ id: detail.value.id });
  if (success) {
    viewItem(detailId.value);
  }
};
// 确认完成订单
const finish = async () => {
  let { success } = await finishOrder({ id: detail.value.id });
  if (success) {
    viewItem(detailId.value);
  }
};
const techList = ref([]);
// 获取技师列表
const bsTechList = async () => {
  let { data, success } = await getBsTechList({
    pageNo: 1,
    pageSize: 100
  });
  if (success) {
    techList.value = data.rows;
  }
};
// 修改订单
const update = async () => {
  closeModal();
  let { success } = await updateOrder({
    id: detail.value.id,
    reserveTime: detail.value.reserveTime,
    technicianId: detail.value.technicianId
  });
  if (success) {
    viewItem(detailId.value);
  }
};
const isChangeTech = ref(true);
// 打开技师选择弹出
const openModal = type => {
  if (type == 0) {
    isChangeTech.value = true;
  } else {
    isChangeTech.value = false;
  }
  techModal.value = true;
};
//删除服务项目
const deleteItem = async () => {
  console.log('删除服务项目');
};
//添加客房
const data = [
  {
    title: 'Ant Design Title 1'
  }
];
const value1 = ref('');
const fistlist = ref([]);
const addchange = e => {
  console.log('添加客房', value1.value);
};
// 关闭弹窗
const closeModal = () => {
  techModal.value = false;
  isChangeTech.value = true;
};
const onChange = (value, dateString) => {
  detail.value.reserveTime = dateString;
};
// 删除订单评价
const deleteOrderEvaluate = async () => {
  Modal.confirm({
    title: () => '确认删除订单评价?',
    async onOk() {
      let { success } = await deleteEvaluate({ id: detailId.value });
      if (success) {
        message.success('删除成功');
        viewItem(detailId.value);
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onCancel() {}
  });
};
</script>
<style scoped>
/* .order-detail {
  max-height: 600px;
  overflow-y: scroll;
} */
</style>