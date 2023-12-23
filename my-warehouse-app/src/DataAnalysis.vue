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
      allLocalLogs: [],
      allAmazonLogs: [],
      localLogs: [],
      amazonLogs: [],
      chart: null,
      searchQuery: '', // 用户的搜索查询
      currentStock: {}, // 当前库存状态，按产品名称
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
        this.allLocalLogs = responses[0].data;
        this.allAmazonLogs = responses[1].data;
        this.localLogs = this.allLocalLogs;
        this.amazonLogs = this.allAmazonLogs;
        this.createChart();
      }).catch(error => {
        console.error("Error fetching data:", error);
      });
    },
    createChart() {
      const canvas = document.getElementById('analysisChart');
      if (!canvas) {
        console.warn("Canvas element not found");
        return;
      }
      const ctx = canvas.getContext('2d');
      if (this.chart) {
        this.chart.destroy();
      }
      const chartData = this.processData();
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: chartData.labels,
          datasets: [
            {
              label: '库存数量',
              data: chartData.inventoryQuantities,
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
    processData() {
    let combinedData = {};
    this.currentStock = {}; // 重置当前库存状态

    const updateInventory = (log, isIncrease) => {
      const productName = log.details.productName || log.details.sku;
      if (!this.currentStock[productName]) {
        this.currentStock[productName] = 0;
      }
      this.currentStock[productName] += isIncrease ? log.details.quantityChange : -log.details.quantityChange;
    };

    const processLogs = logs => {
      logs.forEach(log => {
        const date = new Date(log.timestamp).toLocaleDateString();
        if (!combinedData[date]) {
          combinedData[date] = { inventoryQuantity: 0, shippedQuantity: 0 };
        }

        switch(log.action) {
          case 'Item Added':
          case 'Stock Adjusted':
            // 直接使用库存数量，而不是变化量
            this.currentStock[log.details.productName || log.details.sku] = log.details.after?.actualStock || log.details.actualStock || 0;
            combinedData[date].inventoryQuantity = this.currentStock[log.details.productName || log.details.sku];
            break;
          case 'Item Shipped':
            combinedData[date].shippedQuantity += log.details?.shippingQuantity || 0;
            // 发货后减少库存数量
            this.currentStock[log.details.productName || log.details.sku] -= log.details?.shippingQuantity || 0;
            break;
          case 'Quantity Increased':
            updateInventory(log, true);
            combinedData[date].inventoryQuantity = this.currentStock[log.details.productName || log.details.sku];
            break;
          case 'Quantity Decreased':
            updateInventory(log, false);
            combinedData[date].inventoryQuantity = this.currentStock[log.details.productName || log.details.sku];
            break;
        }
      });
    };

    processLogs(this.localLogs);
    processLogs(this.amazonLogs);

    const labels = Object.keys(combinedData).sort();
    const inventoryQuantities = labels.map(label => combinedData[label].inventoryQuantity);
    const shippedQuantities = labels.map(label => combinedData[label].shippedQuantity);

    return { labels, inventoryQuantities, shippedQuantities };
  },
    searchProduct() {
      if (this.searchQuery) {
        this.localLogs = this.allLocalLogs.filter(log => 
          log.details && (log.details.productName === this.searchQuery || log.details.sku === this.searchQuery)
        );
        this.amazonLogs = this.allAmazonLogs.filter(log => 
          log.details && (log.details.productName === this.searchQuery || log.details.sku === this.searchQuery)
        );
      } else {
        // 重置为所有日志
        this.localLogs = this.allLocalLogs;
        this.amazonLogs = this.allAmazonLogs;
      }
      this.createChart();
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
