<template>
  <div class="tutorial-card" :class="{ 'tutorial-card--featured': featured }">
    <div class="tutorial-card__header">
      <div class="tutorial-card__icon">
        {{ icon }}
      </div>
      <h3 class="tutorial-card__title">{{ title }}</h3>
    </div>
    
    <div class="tutorial-card__content">
      <p class="tutorial-card__description">{{ description }}</p>
      
      <div class="tutorial-card__tags" v-if="tags && tags.length">
        <span 
          v-for="tag in tags" 
          :key="tag" 
          class="tutorial-card__tag"
        >
          {{ tag }}
        </span>
      </div>
    </div>
    
    <div class="tutorial-card__footer">
      <NuxtLink 
        :to="link" 
        class="tutorial-card__link"
        v-if="link"
      >
        {{ linkText || '开始学习' }}
      </NuxtLink>
      
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: '📚'
  },
  tags: {
    type: Array,
    default: () => []
  },
  link: {
    type: String,
    default: ''
  },
  linkText: {
    type: String,
    default: '开始学习'
  },
  featured: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.tutorial-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tutorial-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 20px rgba(0,0,0,0.15);
}

.tutorial-card--featured {
  border: 2px solid #00dc82;
  position: relative;
}

.tutorial-card--featured::before {
  content: '推荐';
  position: absolute;
  top: 10px;
  right: 10px;
  background: #00dc82;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.tutorial-card__header {
  padding: 1.5rem 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.tutorial-card__icon {
  font-size: 1.5rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f9ff;
  border-radius: 50%;
  flex-shrink: 0;
}

.tutorial-card__title {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.tutorial-card__content {
  padding: 1rem 1.5rem;
  flex: 1;
}

.tutorial-card__description {
  color: #666;
  line-height: 1.6;
  margin: 0 0 1rem;
}

.tutorial-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tutorial-card__tag {
  background: #f1f5f9;
  color: #64748b;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
}

.tutorial-card__footer {
  padding: 0 1.5rem 1.5rem;
  margin-top: auto;
}

.tutorial-card__link {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: #00dc82;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.tutorial-card__link:hover {
  background: #00c472;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 220, 130, 0.3);
}
</style>