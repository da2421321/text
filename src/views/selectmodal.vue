<template>
  <el-dialog
    v-model="visible"
    title="优惠券"
    width="800px"
    destroy-on-close
    @close="handleClose"
  >
    <el-form :inline="true" :model="searchForm" class="coupon-search-form">
      <el-form-item label="优惠券名称:">
        <el-input
          v-model="searchForm.couponName"
          placeholder="请输入优惠券名称"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
        </el-button>
      </el-form-item>
    </el-form>

    <el-table
      :data="couponList"
      style="width: 100%"
      v-loading="loading"
      border
      empty-text="暂无数据"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="name" label="优惠券名称"></el-table-column>
      <el-table-column prop="value" label="优惠券面值"></el-table-column>
      <el-table-column prop="minConsumption" label="最低消费额"></el-table-column>
      <el-table-column prop="validityPeriod" label="有效期限"></el-table-column>
      <el-table-column prop="remainingQuantity" label="剩余数量"></el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      ></el-pagination>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="cancelSelection">取消</el-button>
        <el-button type="primary" @click="confirmSelection">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue'; // 引入图标

// Props: 控制弹窗的显示/隐藏
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

// Emits: 用于向父组件传递事件
const emit = defineEmits(['update:modelValue', 'confirm']);

// --- 弹窗可见性控制 ---
const visible = ref(props.modelValue);
// 监听 props.modelValue 变化，同步到内部 visible 状态
watch(
  () => props.modelValue,
  (newVal) => {
    visible.value = newVal;
  }
);
// 监听内部 visible 变化，通过 emit 更新父组件的 modelValue
watch(visible, (newVal) => {
  emit('update:modelValue', newVal);
});

// 处理弹窗关闭事件（例如点击X或按Esc）
const handleClose = () => {
  emit('update:modelValue', false); // 确保父组件知道弹窗已关闭
};

// --- 搜索表单数据 ---
const searchForm = reactive({
  couponName: '',
});

// --- 表格数据 ---
const couponList = ref([]);
const loading = ref(false); // 表格加载状态
const selectedCoupons = ref([]); // 存储选中的行

// --- 分页数据 ---
const pagination = reactive({
  currentPage: 1, // 当前页
  pageSize: 10, // 每页显示条数
  total: 0, // 总条数
});

// --- 模拟数据获取 (请替换为你的实际 API 调用) ---
const fetchCoupons = async () => {
  loading.value = true;
  // 模拟 API 请求延迟
  await new Promise((resolve) => setTimeout(resolve, 500));

  // --- 模拟数据开始 ---
  const allMockCoupons = Array.from({ length: 55 }, (_, i) => ({
    id: i + 1,
    name: `优惠券名称 ${i + 1}`,
    value: `${(i % 5) * 10 + 5}元`,
    minConsumption: `${(i % 10) * 20 + 10}元`,
    validityPeriod: `2024-01-01 至 2024-12-31`,
    remainingQuantity: Math.floor(Math.random() * 100) + 1,
  }));
  // --- 模拟数据结束 ---

  // 根据搜索条件过滤数据
  const filteredCoupons = allMockCoupons.filter((coupon) =>
    coupon.name.includes(searchForm.couponName)
  );

  pagination.total = filteredCoupons.length; // 更新总条数
  // 计算当前页的数据
  const start = (pagination.currentPage - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  couponList.value = filteredCoupons.slice(start, end);

  loading.value = false;
};

// --- 搜索处理函数 ---
const handleSearch = () => {
  pagination.currentPage = 1; // 搜索时重置到第一页
  fetchCoupons();
};

// --- 表格选择变化处理函数 ---
const handleSelectionChange = (selection) => {
  selectedCoupons.value = selection;
};

// --- 分页器处理函数 ---
const handleSizeChange = (val) => {
  pagination.pageSize = val;
  fetchCoupons();
};

const handleCurrentChange = (val) => {
  pagination.currentPage = val;
  fetchCoupons();
};

// --- 弹窗底部按钮操作 ---
const cancelSelection = () => {
  visible.value = false;
  selectedCoupons.value = []; // 取消时清空选择
  ElMessage.info('选择已取消');
};

const confirmSelection = () => {
  if (selectedCoupons.value.length === 0) {
    ElMessage.warning('请至少选择一张优惠券');
    return;
  }
  emit('confirm', selectedCoupons.value); // 向父组件发出确认事件，并附带选中的数据
  visible.value = false; // 关闭弹窗
  ElMessage.success(`已选择 ${selectedCoupons.value.length} 张优惠券`);
};

// --- 组件挂载时加载初始数据 ---
onMounted(() => {
  fetchCoupons();
});
</script>

<style scoped>
.coupon-search-form {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end; /* 右对齐分页器 */
}

.dialog-footer {
  text-align: right;
}
</style>