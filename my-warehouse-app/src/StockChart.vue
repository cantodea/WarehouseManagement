<template>
    <div>
      <line-chart :chart-data="chartData" :options="chartOptions"></line-chart>
    </div>
  </template>
  
  <script>
  import { Line } from 'vue-chartjs'
  import { reactive, toRefs } from 'vue'
  
  export default {
    components: {
      LineChart: Line
    },
    setup() {
      const data = reactive({
        chartData: {
          labels: [], // 日期或其他标签
          datasets: [
            {
              label: '库存调整',
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
              data: [] // 库存调整数据
            },
            {
              label: '发货数量',
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              data: [] // 发货数据
            },
            {
              label: '转移到亚马逊',
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              data: [] // 转移到亚马逊的数据
            }
          ]
        },
        chartOptions: {
          responsive: true,
          maintainAspectRatio: false
        }
      })
  
      const fetchData = async () => {
        // 模拟获取数据
        data.chartData.labels = ['1月', '2月', '3月', '4月', '5月', '6月']
        data.chartData.datasets[0].data = [20, 30, 25, 35, 40, 45] // 库存调整示例数据
        data.chartData.datasets[1].data = [15, 25, 20, 30, 35, 40] // 发货示例数据
        data.chartData.datasets[2].data = [10, 15, 13, 18, 20, 25] // 转移到亚马逊的示例数据
      }
  
      fetchData()
  
      return { ...toRefs(data) }
    }
  }
  </script>
  
  <style>
  /* 添加样式（如果需要） */
  </style>
  