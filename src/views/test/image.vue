<template>
  <div>
    <DwSurveyDcsWrapperV2 :id="id" is-survey-chart="true">
      <template v-slot:dw-dcs-main-slot="{survey}">
        <div v-loading="loading">
          <dw-survey-charts-common 
            v-for="(item,index) in questions" 
            :key="item.id" 
            :id="item.id" 
            :index="index" 
            :question="item"
            ref="chartComponents">
          </dw-survey-charts-common>
          <el-button 
            type="primary" 
            @click="exportToWord" 
            style="margin: 20px 0;"
            :loading="exportLoading">
            导出Word报告
          </el-button>
        </div>
      </template>
    </DwSurveyDcsWrapperV2>
    
    <!-- 隐藏的图表容器，用于导出 -->
    <div style="position: absolute; left: -9999px; top: -9999px;">
      <div v-for="(item, index) in questions" 
           :key="'export-'+item.id" 
           :ref="'exportChart_'+index" 
           class="export-chart-container">
        <div class="chart-title">{{index+1}}、{{ item.quTitle }}【{{ item.quTypeName }}】</div>
        <div v-if="shouldShowChart(item)" 
             class="chart-container" 
             style="width: 600px; height: 400px;"></div>
        <div v-else class="text-data">
          <!-- 填空题显示 -->
          <template v-if="item.quType === 'FILLBLANK'">
            <p>本题为填空题，不提供统计图表</p>
          </template>
          
          <!-- 多项填空题显示 -->
          <template v-else-if="item.quType === 'MULTIFILLBLANK'">
            <p>本题为多项填空题，不提供统计图表</p>
          </template>
          
          <p v-else-if="item.quType === 'UPLOADFILE'">本题为文件上传题，不提供统计图表</p>
          <p v-else-if="item.quType === 'ORDERQU'">本题为排序题，不提供统计图表</p>
          
          <!-- 其他题型 -->
          <template v-else>
            <el-table :data="item.quStatOptions" border style="width: 100%">
              <el-table-column prop="optionName" label="选项" width="180"></el-table-column>
              <el-table-column prop="anCount" label="数量"></el-table-column>
              <el-table-column prop="percent" label="比例"></el-table-column>
            </el-table>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import DwSurveyDcsWrapperV2 from '@/components/common/DwSurveyDcsWrapperV2'
import DwSurveyChartsCommon from './DwsurveyChartsCommon'
import { msgInfo } from '@/utils/dw-msg'
import { dwSurveyReport } from '@/api/dw-survey'
import * as echarts from 'echarts'
import html2canvas from 'html2canvas'
import { saveAs } from 'file-saver'
import { Document, Paragraph, HeadingLevel, ImageRun, TextRun } from 'docx'
import * as docx from 'docx'

export default {
  name: 'DwSurveyCharts',
  components: {
    DwSurveyDcsWrapperV2,
    DwSurveyChartsCommon
  },
  props: {
    id: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      questions: [],
      loading: true,
      exportLoading: false
    }
  },
  mounted() {
    this.surveyChartData()
  },
  methods: {
    shouldShowChart(question) {
      // 显示单选题、多选题和评分题的图表
      return ['RADIO', 'CHECKBOX', 'SCORE'].includes(question.quType)
    },
    
    async surveyChartData() {
      try {
        const response = await dwSurveyReport(this.$route.params.id)
        const resultData = response.data.data
        
        this.questions = resultData.questions || []
        
        if (this.questions.length <= 0) {
          msgInfo('问卷还没有任何题目')
        }
        
        this.processQuestionsData()
        this.loading = false
        
      } catch (error) {
        console.error('获取问卷数据失败:', error)
        this.loading = false
        msgInfo('获取问卷数据失败')
      }
    },
    
    processQuestionsData() {
      this.questions.forEach(questionData => {
        let count = questionData.anCount
        let quOptionsObj
        
        switch (questionData.quType) {
          case 'CHECKBOX':
            questionData.quTypeName = '多选题'
            quOptionsObj = questionData.quCheckboxs
            break
          case 'RADIO':
            questionData.quTypeName = '单选题'
            quOptionsObj = questionData.quRadios
            break
          case 'SCORE':
            questionData.quTypeName = '评分题'
            quOptionsObj = questionData.quScores
            break
          case 'ORDERQU':
            questionData.quTypeName = '排序题'
            quOptionsObj = questionData.quOrderbys
            break
          case 'FILLBLANK':
            questionData.quTypeName = '填空题'
            break
          case 'MULTIFILLBLANK':
            questionData.quTypeName = '多项填空题'
            break
          case 'UPLOADFILE':
            questionData.quTypeName = '文件上传题'
            break
          default:
            questionData.quTypeName = questionData.quType
        }
        
        const quStatOptions = []
        if (quOptionsObj) {
          quOptionsObj.forEach((item, j) => {
            let quStatOption
            
            if (['RADIO', 'CHECKBOX'].includes(questionData.quType)) {
              const anCount = item.anCount || 0
              const percent = count ? ((anCount / count) * 100).toFixed(2) : '0.00'
              quStatOption = {
                optionName: item.optionName,
                anCount: anCount,
                percent: percent
              }
            } else if (questionData.quType === 'SCORE') {
              const avgScore = item.avgScore || 0
              const percent = questionData.paramInt02 
                ? ((avgScore / questionData.paramInt02) * 100).toFixed(2) 
                : '0.00'
              quStatOption = {
                optionName: item.optionName,
                anCount: avgScore.toFixed(2),
                percent: percent
              }
            } else if (questionData.quType === 'ORDERQU') {
              const rankValue = quOptionsObj.length - j
              const percent = ((rankValue / ((1 + quOptionsObj.length) * quOptionsObj.length / 2)) * 100).toFixed(2)
              quStatOption = {
                optionName: item.optionName,
                anCount: rankValue,
                orderNum: j + 1,
                percent: percent
              }
            }
            
            if (quStatOption) {
              quStatOptions.push(quStatOption)
            }
          })
        }
        
        questionData.quStatOptions = quStatOptions
      })
    },
    
    async exportToWord() {
      this.exportLoading = true
      try {
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              this.createTitleSection(),
              ...await this.createQuestionSections()
            ]
          }]
        })
        
        const blob = await docx.Packer.toBlob(doc)
        saveAs(blob, `问卷分析报告.docx`)
        this.$message.success('Word导出成功')
      } catch (error) {
        console.error('导出Word失败:', error)
        this.$message.error('导出Word失败: ' + error.message)
      } finally {
        this.exportLoading = false
      }
    },
    
    createTitleSection() {
      return new Paragraph({
        text: '问卷分析报告',
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 400 }
      })
    },
    
    async createQuestionSections() {
      const sections = []
      
      for (const [i, question] of this.questions.entries()) {
        // 添加题目标题和题型
        sections.push(
          new Paragraph({
            text: `${i+1}、${question.quTitle}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 }
          }),
          new Paragraph({
            text: `【${question.quTypeName}】`,
            spacing: { after: 200 }
          })
        )

        // 根据题目类型添加不同内容
        if (this.shouldShowChart(question)) {
          const imageData = await this.generateChartImage(i, question)
          sections.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: imageData,
                  transformation: {
                    width: 500,
                    height: 350
                  }
                })
              ],
              spacing: { after: 400 }
            })
          )
        } else if (['FILLBLANK', 'MULTIFILLBLANK', 'UPLOADFILE', 'ORDERQU'].includes(question.quType)) {
          sections.push(
            new Paragraph({
              text: `本题为${question.quTypeName}，不提供统计图表`,
              spacing: { after: 400 }
            })
          )
        } else if (question.quStatOptions && question.quStatOptions.length) {
          // 添加表格标题
          sections.push(
            new Paragraph({
              text: '选项统计:',
              spacing: { after: 100 }
            })
          )
          
          // 添加表格标题行
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: '选项\t', bold: true }),
                new TextRun({ text: '数量\t', bold: true }),
                new TextRun({ text: '比例', bold: true })
              ],
              spacing: { after: 100 }
            })
          )
          
          // 添加表格数据行
          question.quStatOptions.forEach(option => {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({ text: option.optionName + '\t' }),
                  new TextRun({ text: option.anCount.toString() + '\t' }),
                  new TextRun({ text: option.percent + '%' })
                ],
                spacing: { after: 100 }
              })
            )
          })
        }
      }
      
      return sections
    },
    
    async generateChartImage(index, question) {
      const exportContainer = this.$refs[`exportChart_${index}`][0]
      const chartContainer = exportContainer.querySelector('.chart-container')
      const chart = echarts.init(chartContainer)
      
      chart.setOption(this.getChartOption(question))
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const canvas = await html2canvas(exportContainer, {
        scale: 2,
        backgroundColor: '#FFFFFF',
        logging: false
      })
      
      chart.dispose()
      return canvas.toDataURL('image/png').split(',')[1]
    },
    
    getChartOption(question) {
      const xData = []
      const yData = []
      const percents = []
      
      question.quStatOptions.forEach(option => {
        xData.push(option.optionName)
        yData.push(question.quType === 'SCORE' ? parseFloat(option.anCount) : option.anCount)
        percents.push(option.percent)
      })
      
      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: params => {
            return `${params[0].name}<br/>${question.quType === 'SCORE' ? '平均分' : '数量'}: ${params[0].value}<br/>占比: ${params[0].percent}%`
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: xData,
          axisLabel: {
            interval: 0,
            rotate: 30
          }
        },
        yAxis: {
          type: 'value',
          name: question.quType === 'SCORE' ? '分数' : '数量',
          nameLocation: 'end'
        },
        series: [{
          name: question.quType === 'SCORE' ? '平均分' : '选择数量',
          type: 'bar',
          data: yData,
          label: {
            show: true,
            position: 'top',
            formatter: params => {
              return `${params.value}\n(${percents[params.dataIndex]}%)`
            }
          },
          itemStyle: {
            color: params => {
              const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de']
              return colors[params.dataIndex % colors.length]
            }
          }
        }]
      }
    }
  }
}
</script>

<style scoped>
.export-chart-container {
  background: white;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
}

.chart-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  text-align: center;
}

.text-data {
  font-size: 14px;
  line-height: 1.8;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.text-data p {
  margin: 5px 0;
}

.el-table {
  margin: 10px 0;
}

.el-table::before {
  background-color: transparent;
}
</style>