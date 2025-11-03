
<template>
  <a-upload
    v-model:file-list="fileList"
    list-type="picture-card"
    @preview="handlePreview"
    @change="handleChange"
    @remove="handleRemove"
    :before-upload="beforeUpload"
    :action="'https://drzx.hainiu.biz/api/file/upload'"
    :data="uploadData"
    :show-upload-list="true"
    style="width: 100%; height: 100%; display: flex"
  >
    <plus-outlined style="font-size: 28px; font-weight: 200" />
  </a-upload>
  <a-modal
    :open="previewVisible"
    :title="previewTitle"
    :footer="null"
    @cancel="handleCancel"
  >
    <img alt="example" style="width: 100%" :src="previewImage" />
  </a-modal>
</template>

<script setup>
import { ref } from "vue";
const fileList = ref([]);
function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}
const previewVisible = ref(false);
const previewImage = ref("");
const previewTitle = ref("");
const handlePreview = async (file) => {
  if (!file.url && !file.preview) {
    file.preview = await getBase64(file.originFileObj);
  }
  previewImage.value = file.url || file.preview;
  previewVisible.value = true;
  previewTitle.value =
    file.name || file.url.substring(file.url.lastIndexOf("/") + 1);
};
const formData = new FormData();
const uploadData = ref({
  secretFlag: "N",
  fileLocation: "1"
});
const handleChange = async(info) => {
   console.log("info",info)
    console.log("1111",fileList.value)

};
const handleRemove = (file) => {
  console.log("2222",file)
};
const handleCancel = () => {
  previewVisible.value = false;
  previewTitle.value = "";
};
const beforeUpload = (file) => {
  console.log(file);
};
const customRequest = (option) => {
  console.log(option);
};
</script>

<style>
</style>
<!-- <template>
  <div>
    <a-input
      v-model:value="name"
      placeholder="请输入姓名"
      style="width: 200px; margin-right: 10px"
    />
    <a-button type="primary" @click="exportWord">导出Word</a-button>

    <div
      style="
        margin-top: 20px;
        border: 1px solid #ddd;
        padding: 10px;
        min-height: 50px;
      "
    >
      <h4>姓名展示区：</h4>
      <p>{{ name || "暂无姓名" }}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
} from "docx";
import { saveAs } from "file-saver";
import { message } from "ant-design-vue";

const name = ref("");

const exportWord = async () => {
  if (!name.value) {
    message.warning("请输入姓名");
    return;
  }

  try {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "个人信息表",
                  bold: true,
                  size: 28,
                }),
              ],
              alignment: "center",
              spacing: { after: 400 },
            }),
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: "姓名", bold: true })],
                        }),
                        new Paragraph({
                          children: [new TextRun({ text: "姓名", bold: true })],
                        }),
                      ],
                      width: { size: 20, type: "pct" },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph(name.value),
                        new Paragraph(name.value),
                      ],
                      width: { size: 80, type: "pct" },
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: "年龄", bold: true })],
                        }),
                        new Paragraph({
                          children: [new TextRun({ text: "年龄", bold: true })],
                        }),
                      ],
                    }),
                    new TableCell({
                      children: [new Paragraph("")],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: "性别", bold: true })],
                        }),
                      ],
                    }),
                    new TableCell({
                      children: [new Paragraph("")],
                    }),
                  ],
                }),
              ],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${name.value}的个人信息.docx`);
    message.success("导出成功");
  } catch (error) {
    console.error("导出失败:", error);
    message.error("导出失败");
  }
};
</script>

<style>
/* 添加一些基本样式 */
.ant-input {
  margin-bottom: 10px;
}
</style>
<!-- <template>
  <el-upload
    class="avatar-uploader"
    action="#"
    :show-file-list="false"
    :auto-upload="false"
    :on-change="handleFileChange"
    :on-before-upload="beforeAvatarUpload"
  >
    <img v-if="imageUrl" :src="imageUrl" class="avatar" />
    <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
  </el-upload>
</template>

<script lang="ts" setup>
import { Plus } from "@element-plus/icons-vue";
import { ref } from "vue";
const imageUrl = ref("");
const handleFileChange = (flie: File) => {
  console.log("handleAvatarSuccess", flie);
   const reader = new FileReader()
  reader.onload = (e) => {
    imageUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(flie.raw)
};

const beforeAvatarUpload = (flie: File) => {
  console.log("beforeAvatarUpload", flie, flie.type);
  return false;
};
</script>

<style>
.avatar-uploader {
  width: 176px;
  height: 176px;
  margin: 0 auto;
}
</style>

<!-- <template>
  <a-upload
    :multiple="true"
    :file-list="fileList"
    :show-upload-list="false"
    @change="handleChange"
  >
    <a-button>
      <upload-outlined />
      上传文件
    </a-button>
  </a-upload>
</template>

<script>
import { UploadOutlined } from "@ant-design/icons-vue";
import { ref } from "vue";

export default {
  components: {
    UploadOutlined
  },
  setup() {
    const fileList = ref([]);

    const handleChange = (info) => {
      console.log('Upload info:', info);
      fileList.value = [...info.fileList];
    };

    return {
      fileList,
      handleChange
    };
  }
};
</script>

<style scoped>
/* 确保按钮可点击 */
.ant-upload {
  display: inline-block;
}
</style> -->  -->