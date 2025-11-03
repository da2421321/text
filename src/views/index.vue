

<template>
  <a-button type="primary" @click="Download">导出</a-button>
  <commontable :columns="columns" :data-source="dataSource" ref="tableRef">
    <template #bodyCell="{ column, record }">
      <template v-if="column.dataIndex === 'action'">
        <a-button type="link" @click="handleAction(record)">删除</a-button>
      </template>
    </template>
  </commontable>
  <iframe class="iframe" :src="'http://www.baidu.com'"></iframe>
</template>

<script lang="ts" setup>
import commontable from "@/components/commontable.vue";
import { ref } from "vue";
const tableRef = ref(null);
const columns = ref([
  {
    dataIndex: "id",
    title: "客户ID",
    isShow: true,
    customRender: ({ index }) => index + 1
  },
  {
    dataIndex: "name",
    title: "客户昵称",
    isShow: true,
  },
  {
    dataIndex: "price",
    title: "价格",
    isShow: true,
  },
  {
    dataIndex: "action",
    title: "操作",
    isShow: true,
  },
]);

const dataSource = ref([
  {
    id: 1,
    name: "apple",
    price: 10,
  },
  {
    id: 2,
    name: "banana",
    price: 20,
  },
  {
    id: 3,
    name: "orange",
    price: 30,
  },
  {
    id: 4,
    name: "pear",
    price: 40,
  },
]);
const Download = () => {
  const tableInstance = tableRef.value;

  // 获取已选中的行数据
  const selectedRows = tableInstance?.selectedRows || [];
  const selectedIds = tableInstance?.selectedRowKeys || [];
  console.log("导出的数据", selectedRows, selectedIds);
};
const handleAction = (record) => {
  console.log("操作记录:", record);
};
</script>
<style scoped>
.iframe {
  width: 100%;
  height: 200px;
}
</style>