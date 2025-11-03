<template>
  <a-table
    :columns="columns"
    :data-source="dataSource"
    :row-key="rowKey"
    :loading="loading"
    :pagination="pagination"
    :row-selection="rowSelection"
    @change="handleTableChange"
  >
    <template v-for="item in renderArr" #[item]="scope">
      <slot :name="item" v-bind="scope"></slot>
    </template>
  </a-table>
</template>

<script setup>
import { ref, defineProps, useSlots, computed } from "vue";

const slots = useSlots();
const renderArr = Object.keys(slots);

const props = defineProps({
  columns: {
    type: Array,
    required: true,
  },
  rowKey: {
    type: String,
    default: "id",
  },
  loading: {
    type: Boolean,
    default: false,
  },
});
const handleTableChange = (pag) => {
  current.value = pag.current;
  pageSize.value = pag.pageSize;
};
const current = ref(1);
const pageSize = ref(10);
const pagination = computed(() => ({
  total: dataSource.value.length,
  current: current.value,
  pageSize: pageSize.value,
  showSizeChanger: true,
  showQuickJumper: true,
  pageSizeOptions: ["10", "20", "30", "50"],
  showTotal: (total) => `共 ${total} 条数据`,
}));
// 数据定义在子组件中
const dataSource = ref([
  { id: 2, name: "apple", price: 10 },
  { id: 2, name: "banana", price: 20 },
  { id: 2, name: "orange", price: 30 },
  { id: 4, name: "pear", price: 40 },
  { id: 5, name: "grape", price: 50 },
  { id: 6, name: "watermelon", price: 60 },
  { id: 7, name: "pineapple", price: 70 },
  { id: 8, name: "strawberry", price: 80 },
  { id: 9, name: "cherry", price: 90 },
  { id: 10, name: "mango", price: 100 },
  { id: 11, name: "kiwi", price: 110 },
  { id: 12, name: "papaya", price: 120 },
  { id: 13, name: "blueberry", price: 130 },
  { id: 14, name: "raspberry", price: 140 },
  { id: 15, name: "blackberry", price: 150 },
  { id: 16, name: "coconut", price: 160 },
  { id: 17, name: "dragonfruit", price: 170 },
  { id: 18, name: "fig", price: 180 },
  { id: 19, name: "guava", price: 190 },
  { id: 20, name: "honeydew", price: 200 },
]);
const selectedRowKeys = ref([]); // 选中的行key数组
const selectedRows = ref([]);    // 选中的行数据数组

const rowSelection = computed(() => ({
  // selectedRowKeys: selectedRowKeys.value,
  onChange: (selectedKeys, selectedRowsData) => {
    selectedRowKeys.value = selectedKeys;
    selectedRows.value = selectedRowsData;
    console.log('选中行keys:', selectedKeys);
    console.log('选中行数据:', selectedRowsData);
  },
  // onSelect: (record, selected, selectedRowsData) => {
  //   console.log('单行选中状态变化:', record, selected);
  // },
  // onSelectAll: (selected, selectedRowsData, changeRows) => {
  //   console.log('全选状态变化:', selected);
  // },
  // getCheckboxProps: (record) => ({
  //   // 可以在这里设置每行的checkbox属性
  //   disabled: record.disabled || false, // 示例：可以设置某些行不可选
  // }),
}));
defineExpose({
  selectedRowKeys,
  selectedRows,
});
</script>