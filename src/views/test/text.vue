<template>
  <div>
    <el-row>
      <el-col :span="20" :offset="2">
        <div class="dw-dcs-main">
          <div class="dw-dcs-main-survey-step">
            <div class="flex items-center mb-12px">
              <div class="mr-24px">
                <el-tag>
                  {{ survey.surveyType == 1 ? "内部问卷" : "外部问卷" }}
                </el-tag>
              </div>
              <div>{{ survey.surveyName }}</div>
            </div>
            <div
              class="dw-dcs-main-survey-step-item dw-dcs-main-survey-step-item-status"
            >
              <el-row type="flex" justify="space-between" align="middle">
                <el-col :span="4">
                  <div>
                    状态：
                    <el-tag v-if="survey.surveyState === 0" size="mini"
                      >设计中</el-tag
                    >
                    <el-tag
                      v-else-if="survey.surveyState === 1"
                      type="success"
                      size="mini"
                      >未开始</el-tag
                    >
                    <el-tag
                      v-else-if="survey.surveyState === 2"
                      type="info"
                      size="mini"
                      >收集中</el-tag
                    >
                    <el-tag
                      v-else-if="survey.surveyState === 3"
                      type="info"
                      size="mini"
                      >收集结束</el-tag
                    >
                    <el-tag
                      v-else-if="survey.surveyState === 4"
                      type="info"
                      size="mini"
                      >停用</el-tag
                    >
                    <el-tag
                      v-else
                      disable-transitions
                      style="margin-left: 10px"
                      size="mini"
                      >未知</el-tag
                    >
                  </div>
                </el-col>
                <el-col :span="4">
                  <div>
                    收集数：{{
                      survey.answerNum != null ? survey.answerNum : 0
                    }}
                    份
                  </div>
                </el-col>
                <el-col :span="4">
                  <div>发放数：{{ totalObj.endNum || 0 }} 份</div>
                </el-col>
                <el-col :span="4">
                  <div>回收率：{{ totalObj.rate || 0 }}%</div>
                </el-col>
                <el-col :span="8" style="text-align: right">
                  创建时间：{{ survey.createDate }}
                </el-col>
              </el-row>
            </div>
            <div
              v-if="survey.surveyType == 1"
              class="dw-dcs-main-survey-step-main"
            >
              <slot :survey="survey" name="dw-dcs-main-slot"></slot>
            </div>
          </div>
          <el-button type="primary" size="small" @click="exportToExcel"
            >导出Excel</el-button
          >
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { dwSurveyInfo, dwSurveyReport } from "@/api/dw-survey";
import * as XLSX from 'xlsx';

export default {
  name: "DwSurveyDcsWrapper",
  props: {
    id: { type: String, default: "" },
    isAnswerUrl: { type: Boolean, default: false },
    isSurveySet: { type: Boolean, default: false },
    isSiteShare: { type: Boolean, default: false },
    isSiteComp: { type: Boolean, default: false },
    isAnswerWx: { type: Boolean, default: false },
    isSurveyChart: { type: Boolean, default: false },
    isAnswerData: { type: Boolean, default: false },
    isSurveyLog: { type: Boolean, default: false },
    isAnswerLog: { type: Boolean, default: false },
  },
  data() {
    return {
      survey: {
        sid: "",
        answerUrl: "",
        answerUrl1: "",
        answerUrlQR: "",
        siteCompCodeRoot: "",
        surveyState: "",
      },
      totalObj: {
        endNum: 0,
        rate: 0,
      },
      prevPath: "/dw",
    };
  },
  mounted() {
    this.getSurveyInfo();
    this.getTotal();
  },
  methods: {
    buttonClickA(href) {
      window.location.href = `${process.env.DW_WEB_PREFIX}${href}`;
    },
    handlePush(to) {
      this.$router.push(to);
    },

    getTotal() {
      dwSurveyReport(this.$route.params.id).then((response) => {
        const httpResult = response.data;
        this.totalObj = httpResult && httpResult.data;
      });
    },

     async exportToExcel() {
      try {
        this.$message.info("正在生成Excel文件...");
        const response = await dwSurveyReport(this.$route.params.id);
        const surveyData = response.data && response.data.data;

        if (!(surveyData && surveyData.questions && surveyData.questions.length)) {
          this.$message.warning("没有可导出的问题数据");
          return;
        }

        // 创建工作簿
        const wb = XLSX.utils.book_new();
        
        // 创建工作表数据
        const excelData = [
          ['问题序号', '问题标题', '问题类型', '总回答数', '选项统计']
        ];

        // 处理每个问题
        surveyData.questions.forEach((question, index) => {
          const row = [
            index + 1,
            question.quTitle || '',
            this.getQuTypeName(question.quType),
            question.anCount || 0
          ];

          // 生成选项统计信息
          if (question.quType === "FILLBLANK" || question.quType === "UPLOADFILE") {
            row.push('填空题/文件题无选项统计');
          } else {
            const options = this.getQuestionOptions(question);
            const total = question.anCount || 1;
            
            const optionStats = options.map(option => {
              const count = option.anCount || 0;
              const percent = ((count / total) * 100).toFixed(2);
              return `${option.optionName}: ${count}(${percent}%)`;
            }).join('; ');
            
            row.push(optionStats || '无选项数据');
          }

          excelData.push(row);
        });

        // 将数据添加到工作表
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, ws, "问卷数据");

        // 导出Excel文件
        XLSX.writeFile(wb, `${surveyData.surveyName}_问卷数据.xlsx`);
        this.$message.success("导出成功");
      } catch (error) {
        console.error("导出失败:", error);
        this.$message.error("导出失败: " + (error.message || "未知错误"));
      }
    },

    getSurveyStateText(state) {
      const states = {
        0: "设计中",
        1: "未开始",
        2: "收集中",
        3: "收集结束",
        4: "停用",
      };
      return states[state] || "未知状态";
    },

    getQuTypeName(quType) {
      const types = {
        RADIO: "单选题",
        CHECKBOX: "多选题",
        FILLBLANK: "填空题",
        UPLOADFILE: "文件题",
        SCORE: "评分题",
        ORDERQU: "排序题",
        MULTIFILLBLANK: "多项填空题",
      };
      return types[quType] || quType;
    },

    getQuestionOptions(question) {
      if (!question) return [];
      switch (question.quType) {
        case "RADIO":
          return question.quRadios || [];
        case "CHECKBOX":
          return question.quCheckboxs || [];
        case "SCORE":
          return question.quScores || [];
        case "ORDERQU":
          return question.quOrderbys || [];
        case "MULTIFILLBLANK":
          return question.quMultiFillblanks || [];
        default:
          return [];
      }
    },

    getSurveyInfo() {
      dwSurveyInfo(this.$route.params.id).then((response) => {
        const resultData = response.data && response.data.data;
        if (!resultData) return;

        this.survey = resultData;
        this.survey.answerUrl =
          location.origin + "/#/diaowen/" + (this.survey.sid || "");
        this.survey.answerUrl1 =
          location.origin +
          (process.env.DW_WEB_PREFIX || "") +
          "/static/diaowen/answer-p.html?sid=" +
          (this.survey.sid || "");
        this.survey.answerUrlQR =
          (process.env.DW_API_URL || "") +
          "/api/dwsurvey/anon/response/answerTD.do?surveyId=" +
          (this.survey.id || "");
        this.survey.siteCompCodeRoot = `<div id="dwsurveyWebAnswerCompCode"><div id="dwsurveyWebSiteFixed" style="position: fixed; right: 0px; left: auto; top: 520px; z-index: 99999;">
            <a target='_blank' id="dwsurveyWebSiteFixedA" href="${this.survey.answerUrl}" 
              style="background-color: rgb(24, 144, 255); width: 15px; display: block; padding: 10px 6px 10px 10px; color: white; 
              cursor: pointer; float: right; vertical-align: middle; text-decoration: none; font-size: 12px; box-sizing: content-box; line-height: 20px;">
              问卷调查</a></div></div>`;

        if (resultData.surveyDetail) {
          this.survey.surveyDetail.effective =
            resultData.surveyDetail.effective === 1;
          this.survey.surveyDetail.effectiveIp =
            resultData.surveyDetail.effectiveIp === 1;
          this.survey.surveyDetail.refresh =
            resultData.surveyDetail.refresh === 1;
          this.survey.surveyDetail.rule = resultData.surveyDetail.rule === 1;
          this.survey.surveyDetail.ynEndNum =
            resultData.surveyDetail.ynEndNum === 1;
          this.survey.surveyDetail.ynEndTime =
            resultData.surveyDetail.ynEndTime === 1;
        }
      });
    },
  },
};
</script>

<style scoped>
.dw-dcs-main {
  background-color: white;
  padding: 20px;
}
.dw-dcs-main-survey-title {
  border-bottom: 1px solid rgb(241, 242, 245);
  padding-bottom: 20px;
  padding-left: 10px;
}
.dw-dcs-main-survey-title-content {
  font-size: 26px;
  font-weight: 300;
}
.dw-dcs-main-survey-step {
  padding: 0px;
}
.dw-dcs-main-survey-step-item {
  padding: 20px 10px;
  border-bottom: 1px solid rgb(241, 242, 245);
}
.dw-link {
  text-decoration: none;
  color: #606266;
  font-size: 14px;
}
.dw-link-1 {
  font-size: 14px;
}
.dw-link-primary,
.dw-link:hover {
  color: #409eff;
  font-weight: bold;
}
.dw-link i {
  margin-right: 6px;
}
.dw-dcs-main-survey-step-main {
  padding: 20px 10px;
}
.dw-dcs-main-survey-step-item-status {
  background-color: rgb(241, 242, 245);
  font-size: 14px;
  padding: 10px;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.mr-24px {
  margin-right: 24px;
}

.mb-12px {
  margin-bottom: 12px;
}
</style>