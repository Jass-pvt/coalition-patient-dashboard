import { describe, it, expect } from 'vitest'
import { buildChartData, chartOptions, CHART_COLORS } from '../components/charts/chartConfig'

describe('chartConfig', () => {
  const sampleEntries = [
    { label: 'Oct, 2023', systolic: { value: 120 }, diastolic: { value: 80 } },
    { label: 'Nov, 2023', systolic: { value: 130 }, diastolic: { value: 85 } },
    { label: 'Dec, 2023', systolic: { value: 125 }, diastolic: { value: 78 } },
  ]

  describe('buildChartData', () => {
    it('constructs systolic and diastolic datasets with correct labels and colors', () => {
      const data = buildChartData(sampleEntries)

      expect(data.labels).toEqual(['Oct, 2023', 'Nov, 2023', 'Dec, 2023'])
      expect(data.datasets).toHaveLength(2)

      const [systolic, diastolic] = data.datasets
      expect(systolic.label).toBe('Systolic')
      expect(systolic.data).toEqual([120, 130, 125])
      expect(systolic.borderColor).toBe(CHART_COLORS.systolic)

      expect(diastolic.label).toBe('Diastolic')
      expect(diastolic.data).toEqual([80, 85, 78])
      expect(diastolic.borderColor).toBe(CHART_COLORS.diastolic)
    })

    it('handles empty entries array', () => {
      const data = buildChartData([])
      expect(data.labels).toEqual([])
      expect(data.datasets[0].data).toEqual([])
      expect(data.datasets[1].data).toEqual([])
    })
  })

  describe('chartOptions', () => {
    it('configures y-axis bounds from 60 to 180 with step 20', () => {
      expect(chartOptions.scales.y.min).toBe(60)
      expect(chartOptions.scales.y.max).toBe(180)
      expect(chartOptions.scales.y.ticks.stepSize).toBe(20)
    })

    it('formats tooltips with mmHg unit', () => {
      const labelFn = chartOptions.plugins.tooltip.callbacks.label
      expect(labelFn({ dataset: { label: 'Systolic' }, parsed: { y: 160 } })).toBe('Systolic: 160 mmHg')
      expect(labelFn({ dataset: { label: 'Systolic' }, parsed: { y: null } })).toBe('Systolic: n/a')
    })
  })
})
