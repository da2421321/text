<template>
  <div>
    <el-form ref="editPramRef" :model="editPram" label-width="130px">
      <el-form-item
        label="分类名称"
        prop="name"
        :rules="[{ required:true,message:'请输入分类名称',trigger:['blur','change'] }]"
      >
        <el-input v-model="editPram.name" :maxlength="biztype.value === 1 ? 8 : 20" placeholder="分类名称" />
      </el-form-item>
      <el-form-item label="URL" v-if="biztype.value!==1 && biztype.value!==3">
        <el-input v-model="editPram.url" placeholder="URL" />
      </el-form-item>
      <el-form-item label="父级" v-if="biztype.value!==3">
        <el-cascader 
          v-model="editPram.pid" 
          :disabled="isCreate ===1 && editPram.pid ===0" 
          :options="biztype.value === 5 ? allTreeList : parentOptions" 
          :props="categoryProps" 
          style="width:100%" 
        />
      </el-form-item>
      <el-form-item label="菜单图标" v-if="biztype.value===5">
        <el-input placeholder="请选择菜单图标" v-model="editPram.extra">
          <el-button slot="append" icon="el-icon-circle-plus-outline" @click="addIcon"></el-button>
        </el-input>
      </el-form-item>
      <el-form-item label="分类图标(180 * 180)" v-if="biztype.value === 1 || biztype.value === 3">
        <div class="upLoadPicBox" @click="modalPicTap('1')">
          <div v-if="editPram.extra" class="pictrue">
            <img :src="editPram.extra">
          </div>
          <div v-else class="upLoad">
            <i class="el-icon-camera cameraIconfont" />
          </div>
        </div>
      </el-form-item>
      <el-form-item label="排序">
        <el-input-number v-model="editPram.sort" :min="0"/>
      </el-form-item>
      <el-form-item label="状态">
        <el-switch 
          v-model="editPram.status"  
          active-text="显示"
          inactive-text="隐藏" 
          :active-value="true" 
          :inactive-value="false" 
        />
      </el-form-item>
      <el-form-item label="扩展字段" v-if="biztype.value !== 1 && biztype.value !== 3 && biztype.value !== 5">
        <el-input v-model="editPram.extra" type="textarea" placeholder="扩展字段" />
      </el-form-item>
      <el-form-item>
        <el-button 
          type="primary" 
          :loading="loadingBtn" 
          @click="handlerSubmit('editPramRef')" 
          v-hasPermi="['admin:category:update']"
        >
          确定
        </el-button>
        <el-button @click="close">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { defineComponent, ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

export default defineComponent({
  name: 'CategoryEdit',
  props: {
    prent: {
      type: Object,
      required: true
    },
    isCreate: {
      type: Number,
      default: 0
    },
    editData: {
      type: Object
    },
    biztype: {
      type: Object,
      required: true
    },
    allTreeList: {
      type: Array
    }
  },
  setup(props, { emit }) {
    const loadingBtn = ref(false);
    const editPramRef = ref(null);
    const parentOptions = ref([]);
    
    // 表单数据
    const editPram = reactive({
      extra: null,
      name: null,
      pid: null,
      sort: 0,
      status: true,
      type: props.biztype.value,
      url: null,
      id: 0
    });

    // 级联选择器配置
    const categoryProps = reactive({
      value: 'id',
      label: 'name',
      children: 'child',
      expandTrigger: 'hover',
      checkStrictly: true,
      emitPath: false
    });

    // 点击图标
    const addIcon = () => {
      // 模拟图标选择
      editPram.extra = 'el-icon-star-on';
      ElMessage.success('已选择图标');
    };

    // 点击商品图
    const modalPicTap = (tit) => {
      // 模拟图片上传
      editPram.extra = 'https://dummyimage.com/180x180/eee/999';
      ElMessage.success('已上传图片');
    };

    // 关闭对话框
    const close = () => {
      emit('hideEditDialog');
    };

    // 初始化编辑数据
    const initEditData = () => {
      parentOptions.value = [...props.allTreeList];
      addTreeListLabelForCasCard(parentOptions.value, 'child');
      
      const { extra, name, pid, sort, status, type, id, url } = props.editData;
      
      if(props.isCreate === 1) {
        editPram.extra = extra;
        editPram.name = name;
        editPram.pid = pid;
        editPram.sort = sort;
        editPram.status = status;
        editPram.type = type;
        editPram.url = url;
        editPram.id = id;
      } else {
        editPram.pid = props.prent.id;
        editPram.type = props.biztype.value;
      }
    };

    // 为级联选择器添加标签
    const addTreeListLabelForCasCard = (arr, child) => {
      arr.forEach((o) => {
        if (o.child && o.child.length) {
          o.child.forEach((j) => {
            j.disabled = true;
          });
        }
      });
    };

    // 提交表单
    const handlerSubmit = (formName) => {
      editPramRef.value.validate((valid) => {
        if (!valid) return;
        handlerSaveOrUpdate(props.isCreate === 0);
      });
    };

    // 保存或更新
    const handlerSaveOrUpdate = (isSave) => {
      loadingBtn.value = true;
      
      // 模拟API调用延迟
      setTimeout(() => {
        emit('hideEditDialog');
        ElMessage.success(isSave ? '创建目录成功(模拟)' : '更新目录成功(模拟)');
        loadingBtn.value = false;
        
        // 返回表单数据用于演示
        emit('submit', {
          ...editPram,
          pid: Array.isArray(editPram.pid) ? editPram.pid[0] : editPram.pid
        });
      }, 500);
    };

    // 生命周期钩子
    onMounted(() => {
      initEditData();
    });

    return {
      loadingBtn,
      editPramRef,
      editPram,
      categoryProps,
      parentOptions,
      addIcon,
      modalPicTap,
      close,
      handlerSubmit,
      handlerSaveOrUpdate
    };
  }
});
</script>

<style scoped>
.upLoadPicBox {
  width: 180px;
  height: 180px;
  line-height: 180px;
  border: 1px dotted rgba(0,0,0,0.1);
  border-radius: 4px;
  background: rgba(0,0,0,0.02);
  cursor: pointer;
  text-align: center;
}

.upLoadPicBox .pictrue {
  width: 100%;
  height: 100%;
}

.upLoadPicBox .pictrue img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.upLoadPicBox .upLoad {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upLoadPicBox .upLoad .cameraIconfont {
  font-size: 28px;
  color: #909399;
}
</style>