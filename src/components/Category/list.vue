<template>
  <div>
    <template v-if="selectModel">
      <el-tree
        ref="treeRef"
        :data="treeList"
        show-checkbox
        node-key="id"
        @check="getCurrentNode"
        :default-checked-keys="selectModelKeysNew"
        :props="treeProps"
      />
    </template>
    <template v-else>
      <div class="divBox">
        <el-card class="box-card">
          <div class="clearfix">
            <div class="container">
              <el-form inline size="small">
                <el-form-item label="状态：">
                  <el-select
                    v-model="listPram.status"
                    placeholder="状态"
                    class="selWidth"
                    @change="handlerGetList"
                  >
                    <el-option label="全部" :value="-1" />
                    <el-option label="显示" :value="1" />
                    <el-option label="不显示" :value="0" />
                  </el-select>
                </el-form-item>
                <el-form-item label="名称：">
                  <el-input
                    v-model="listPram.name"
                    placeholder="请输入名称"
                    class="selWidth"
                    size="small"
                    clearable
                  >
                    <el-button
                      slot="append"
                      icon="el-icon-search"
                      @click="handlerGetList"
                      size="small"
                    />
                  </el-input>
                </el-form-item>
              </el-form>
            </div>
            <el-button
              size="mini"
              type="primary"
              @click="handleAddMenu({ id: 0, name: '顶层目录' })"
              v-hasPermi="['admin:category:save']"
            >
              新增{{ biztype.name }}
            </el-button>
          </div>
          <el-table
            ref="treeListRef"
            :data="treeList"
            size="mini"
            class="table"
            highlight-current-row
            row-key="id"
            :tree-props="{ children: 'child', hasChildren: 'hasChildren' }"
          >
            <el-table-column prop="name" label="名称" min-width="240">
              <template #default="scope">
                {{ scope.row.name }} | {{ scope.row.id }}
              </template>
            </el-table-column>
            <template v-if="!selectModel">
              <el-table-column label="类型" min-width="150">
                <template #default="scope">
                  <span>{{ filterCategroyType(scope.row.type) || "-" }}</span>
                </template>
              </el-table-column>
              <el-table-column label="分类图标" min-width="80">
                <template #default="scope">
                  <div class="listPic" v-if="biztype.value === 5">
                    <i
                      :class="'el-icon-' + scope.row.extra"
                      style="font-size: 20px"
                    />
                  </div>
                  <div class="demo-image__preview" v-else>
                    <el-image
                      style="width: 36px; height: 36px"
                      :src="scope.row.extra"
                      :preview-src-list="[scope.row.extra]"
                      v-if="scope.row.extra"
                    />
                    <img
                      style="width: 36px; height: 36px"
                      v-else
                      :src="defaultImg"
                      alt=""
                    />
                  </div>
                </template>
              </el-table-column>
              <el-table-column
                label="Url"
                min-width="250"
                v-if="biztype.value === 5"
                key="2"
              >
                <template #default="scope">
                  <span>{{ scope.row.url }}</span>
                </template>
              </el-table-column>
              <el-table-column label="排序" prop="sort" min-width="150" />
              <el-table-column label="状态" min-width="150">
                <template #default="scope">
                  <el-switch
                    v-model="scope.row.status"
                    :active-value="true"
                    :inactive-value="false"
                    active-text="显示"
                    inactive-text="隐藏"
                    @change="onchangeIsShow(scope.row)"
                  />
                </template>
              </el-table-column>

              <el-table-column label="操作" min-width="200" fixed="right">
                <template #default="scope">
                  <el-button
                    v-if="
                      (biztype.value === 1 && scope.row.pid === 0) ||
                      biztype.value === 5
                    "
                    type="text"
                    size="small"
                    @click="handleAddMenu(scope.row)"
                  >
                    添加子目录
                  </el-button>
                  <el-button
                    type="text"
                    size="small"
                    @click="handleEditMenu(scope.row)"
                    v-hasPermi="['admin:category:info']"
                  >
                    编辑
                  </el-button>
                  <el-button
                    type="text"
                    size="small"
                    @click="handleDelMenu(scope.row)"
                    v-hasPermi="['admin:category:delete']"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </template>
          </el-table>
        </el-card>
      </div>
    </template>
    <el-dialog
      :title="
        editDialogConfig.isCreate === 0
          ? `创建${biztype.name}`
          : `编辑${biztype.name}`
      "
      v-model="editDialogConfig.visible"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <edit
        v-if="editDialogConfig.visible"
        :prent="editDialogConfig.prent"
        :is-create="editDialogConfig.isCreate"
        :edit-data="editDialogConfig.data"
        :biztype="editDialogConfig.biztype"
        :all-tree-list="treeList"
        @hideEditDialog="hideEditDialog"
      />
    </el-dialog>
  </div>
</template>

<script>
import { defineComponent, ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import Edit from "./edit.vue";
import defaultImg from "@/assets/imgs/moren.jpg";

export default defineComponent({
  name: "CategoryList",
  components: { Edit },
  props: {
    biztype: {
      type: Object,
      default: () => ({ value: -1 }),
      validator: (obj) => obj.value > 0,
    },
    pid: {
      type: Number,
      default: 0,
      validator: (value) => value >= 0,
    },
    selectModel: {
      type: Boolean,
      default: false,
    },
    selectModelKeys: {
      type: Array,
    },
    rowSelect: {},
  },
  setup(props, { emit }) {
    // 树形组件引用
    const treeRef = ref(null);
    const treeListRef = ref(null);

    // 数据状态
    const selectModelKeysNew = ref(props.selectModelKeys || []);
    const loading = ref(false);
    const treeList = ref([]);
    const multipleSelection = ref([]);

    // 对话框配置
    const editDialogConfig = reactive({
      visible: false,
      isCreate: 0,
      prent: {},
      data: {},
      biztype: props.biztype,
    });

    // 查询参数
    const listPram = reactive({
      pid: props.pid,
      type: props.biztype.value,
      status: -1,
      name: "",
      page: 1,
      limit: 20,
    });

    // 树形配置
    const treeProps = reactive({
      label: "name",
      children: "child",
    });

    // 模拟数据
    const mockData = [
      {
        id: 1,
        name: "一级分类",
        pid: 0,
        type: props.biztype.value,
        status: true,
        sort: 0,
        extra: "picture1.jpg",
        url: "/category/1",
        child: [
          {
            id: 2,
            name: "二级分类",
            pid: 1,
            type: props.biztype.value,
            status: true,
            sort: 0,
            extra: "picture2.jpg",
            url: "/category/2",
            child: [],
          },
        ],
      },
    ];

    // 类型过滤器
    const filterCategroyType = (type) => {
      const types = {
        1: "产品分类",
        2: "附件分类",
        3: "文章分类",
        4: "设置分类",
        5: "菜单分类",
      };
      return types[type] || "";
    };

    // 切换状态
    const onchangeIsShow = (row) => {
      // 模拟API调用
      setTimeout(() => {
        ElMessage.success("状态修改成功(模拟)");
        handlerGetTreeList();
      }, 300);
    };

    // 编辑菜单
    const handleEditMenu = (rowData) => {
      editDialogConfig.isCreate = 1;
      editDialogConfig.data = { ...rowData };
      editDialogConfig.prent = { ...rowData };
      editDialogConfig.visible = true;
    };

    // 添加菜单
    const handleAddMenu = (rowData) => {
      editDialogConfig.isCreate = 0;
      editDialogConfig.prent = { ...rowData };
      editDialogConfig.data = {};
      editDialogConfig.biztype = props.biztype;
      editDialogConfig.visible = true;
    };

    // 获取当前选中节点
    const getCurrentNode = (data) => {
      const node = treeRef.value.getNode(data);
      childNodes(node);
      emit("rulesSelect", treeRef.value.getCheckedKeys());
    };

    // 递归处理子节点
    const childNodes = (node) => {
      const len = node.childNodes.length;
      for (let i = 0; i < len; i++) {
        node.childNodes[i].checked = node.checked;
        childNodes(node.childNodes[i]);
      }
    };

    // 删除菜单
    const handleDelMenu = (rowData) => {
      ElMessageBox.confirm("确定删除当前数据?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        // 模拟删除
        setTimeout(() => {
          ElMessage.success("删除成功(模拟)");
          handlerGetTreeList();
        }, 300);
      });
    };

    // 获取列表
    const handlerGetList = () => {
      handlerGetTreeList();
    };

    // 获取树形列表
    const handlerGetTreeList = () => {
      loading.value = true;
      // 模拟API调用
      setTimeout(() => {
        treeList.value = [...mockData];
        loading.value = false;
      }, 500);
    };

    // 关闭对话框
    const hideEditDialog = () => {
      setTimeout(() => {
        editDialogConfig.prent = {};
        editDialogConfig.type = 0;
        editDialogConfig.visible = false;
        handlerGetTreeList();
      }, 200);
    };

    // 选中项变化
    const handleSelectionChange = (d1, { checkedNodes, checkedKeys }) => {
      multipleSelection.value = checkedKeys;
      emit("rulesSelect", multipleSelection.value);
    };

    // 初始化
    onMounted(() => {
      handlerGetTreeList();
    });

    return {
      treeRef,
      treeListRef,
      selectModelKeysNew,
      loading,
      treeList,
      listPram,
      editDialogConfig,
      treeProps,
      multipleSelection,
      defaultImg,
      filterCategroyType,
      onchangeIsShow,
      handleEditMenu,
      handleAddMenu,
      getCurrentNode,
      childNodes,
      handleDelMenu,
      handlerGetList,
      handlerGetTreeList,
      hideEditDialog,
      handleSelectionChange,
    };
  },
});
</script>

<style scoped>
.divBox {
  margin: 20px;
}
.selWidth {
  width: 220px;
}
.listPic {
  display: flex;
  justify-content: center;
  align-items: center;
}
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}
</style>