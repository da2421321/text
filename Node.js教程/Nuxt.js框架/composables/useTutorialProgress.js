/**
 * 教程进度管理组合式函数
 * 用于跟踪用户在Nuxt.js教程中的学习进度
 */

export const useTutorialProgress = () => {
  // 进度状态
  const progress = useState('tutorial-progress', () => ({
    completedSections: [],
    currentSection: '',
    totalTime: 0
  }))

  // 标记章节为已完成
  const markSectionAsCompleted = (sectionId) => {
    if (!progress.value.completedSections.includes(sectionId)) {
      progress.value.completedSections.push(sectionId)
    }
  }

  // 设置当前章节
  const setCurrentSection = (sectionId) => {
    progress.value.currentSection = sectionId
  }

  // 增加学习时间
  const addStudyTime = (minutes) => {
    progress.value.totalTime += minutes
  }

  // 获取完成百分比
  const getCompletionPercentage = (totalSections) => {
    if (totalSections <= 0) return 0
    return Math.round((progress.value.completedSections.length / totalSections) * 100)
  }

  // 重置进度
  const resetProgress = () => {
    progress.value = {
      completedSections: [],
      currentSection: '',
      totalTime: 0
    }
  }

  // 检查章节是否已完成
  const isSectionCompleted = (sectionId) => {
    return progress.value.completedSections.includes(sectionId)
  }

  // 获取学习统计
  const getStudyStats = () => {
    return {
      completedCount: progress.value.completedSections.length,
      totalTime: progress.value.totalTime,
      currentSection: progress.value.currentSection
    }
  }

  return {
    // 状态
    progress,

    // 方法
    markSectionAsCompleted,
    setCurrentSection,
    addStudyTime,
    getCompletionPercentage,
    resetProgress,
    isSectionCompleted,
    getStudyStats
  }
}