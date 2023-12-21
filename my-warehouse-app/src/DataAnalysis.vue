<template>
  <div>
    <h1>数据分析</h1>
    <div>
      <!-- 用户输入产品名称或SKU -->
      <input v-model="searchQuery" placeholder="输入产品名或SKU" />
      <button @click="searchProduct">查询</button>
    </div>
    <div>
      <canvas id="analysisChart"></canvas>
    </div>
  </div>
</template>
  
<script>
import axios from 'axios';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default {
  name: 'DataAnalysis',
  data() {
    return {
      localLogs: [],
      amazonLogs: [],
      chart: null,
      searchQuery: '', // 用户的搜索查询
    };
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      Promise.all([
        axios.get('/api/local-logs'),
        axios.get('/api/amazon-logs')
      ]).then(responses => {
        this.localLogs = responses[0].data;
        this.amazonLogs = responses[1].data;
        this.createChart(this.localLogs, this.amazonLogs);
      }).catch(error => {
        console.error("Error fetching data:", error);
      });
    },
    createChart(localLogs, amazonLogs) {
      const canvas = document.getElementById('analysisChart');
      if (!canvas) {
        console.warn("Canvas element not found");
        return;
      }
      const ctx = canvas.getContext('2d');
      if (this.chart) {
        this.chart.destroy();
      }
      const chartData = this.processData(localLogs, amazonLogs);
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: chartData.labels,
          datasets: [
            {
              label: '库存调整',
              data: chartData.stockAdjustments,
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1
            },
            {
              label: '发货数量',
              data: chartData.shippedQuantities,
              borderColor: 'rgb(255, 99, 132)',
              tension: 0.1
            }
          ]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    },
    processData(localLogs, amazonLogs) {
      let combinedData = {};

      const processLogs = (logs, isAmazon) => {
        logs.forEach(log => {
          const date = new Date(log.timestamp).toLocaleDateString();
          if (!combinedData[date]) {
            combinedData[date] = { stockAdjustment: 0, shippedQuantity: 0 };
          }

          if (isAmazon && log.action === 'Quantity Increased' && log.details) {
            combinedData[date].stockAdjustment += log.details.quantityChange || 0;
          } else if (!isAmazon && log.action === 'Stock Adjusted' && log.details && log.details.before && log.details.after) {
            const adjustment = log.details.after.actualStock - log.details.before.actualStock;
            combinedData[date].stockAdjustment += adjustment;
          }

          if (log.action === 'Item Shipped' && log.details) {
            combinedData[date].shippedQuantity += (log.details.shippingQuantity || 0);
          }
        });
      };

      processLogs(localLogs, false);
      processLogs(amazonLogs, true);

      const labels = Object.keys(combinedData).sort();
      const stockAdjustments = labels.map(label => combinedData[label].stockAdjustment);
      const shippedQuantities = labels.map(label => combinedData[label].shippedQuantity);

      return { labels, stockAdjustments, shippedQuantities };
    },
    searchProduct() {
      const filteredLocalLogs = this.localLogs.filter(log => 
        log.details && (log.details.productName === this.searchQuery || log.details.sku === this.searchQuery)
      );
      const filteredAmazonLogs = this.amazonLogs.filter(log => 
        log.details && (log.details.productName === this.searchQuery || log.details.sku === this.searchQuery)
      );

      this.createChart(filteredLocalLogs, filteredAmazonLogs);
    }
  }
};
</script>
  
<style>
/* 添加样式 */
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}
th {
  background-color: #f4f4f4;
}
</style>
