<template>
  <div>
    <el-tree :data="treeData" :props="defaultProps" @node-click="handleNodeClick" />
  </div>
</template>

<script>
import { defineComponent, ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

export default defineComponent({
  name: 'CategoryTree',
  props: {
    id: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    // 树形配置
    const defaultProps = reactive({
      children: 'children',
      label: 'label'
    });

    // 树形数据
    const treeData = ref([
      {
        label: '一级 1',
        children: [
          {
            label: '二级 1-1',
            children: [
              {
                label: '三级 1-1-1'
              }
            ]
          }
        ]
      },
      {
        label: '一级 2',
        children: [
          {
            label: '二级 2-1',
            children: [
              {
                label: '三级 2-1-1'
              }
            ]
          },
          {
            label: '二级 2-2',
            children: [
              {
                label: '三级 2-2-1'
              }
            ]
          }
        ]
      },
      {
        label: '一级 3',
        children: [
          {
            label: '二级 3-1',
            children: [
              {
                label: '三级 3-1-1'
              }
            ]
          },
          {
            label: '二级 3-2',
            children: [
              {
                label: '三级 3-2-1'
              }
            ]
          }
        ]
      }
    ]);

    // 数据结果 (模拟)
    const dataList = reactive({
      page: 0,
      limit: 0,
      totalPage: 0,
      total: 0,
      list: []
    });

    // 获取树形数据 (模拟)
    const handlerGetTreeList = id => {
      if (!id) {
        ElMessage.error('当前数据id不正确');
        return;
      }

      // 模拟API调用
      setTimeout(() => {
        dataList.list = [...treeData.value]; // 模拟返回数据
        ElMessage.success('树形数据加载成功(模拟)');
      }, 300);
    };

    // 节点点击事件
    const handleNodeClick = data => {
      console.log('点击节点:', data);
    };

    // 生命周期钩子
    onMounted(() => {
      handlerGetTreeList(props.id);
    });

    return {
      defaultProps,
      treeData,
      dataList,
      handleNodeClick
    };
  }
});
</script>

<style scoped>
/* 可以根据需要添加样式 */
</style>