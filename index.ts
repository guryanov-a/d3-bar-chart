import axios from "axios";
import * as d3 from "d3";
import { format as formatDate } from 'date-fns';
import './index.scss';

const CHART_DATA_PATH: string = "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/GDP-data.json";
const CHART_WIDTH: number = 1024;
const CHART_HEIGHT: number = 600;
const CHART_PADDING: number = 50;
const DATE_FORMAT: string = 'YYYY-MM-DD';

document.addEventListener("DOMContentLoaded", function(): void {
  initChart();
});

async function initChart(): Promise<void> {
  let data: any = await getChartData();
  let dataset: any = parseServerChartData(data.data);
  createBarChart(dataset);
}

async function getChartData(): Promise<any> {
  let response;

  try {
    response = await axios.get(CHART_DATA_PATH);
  } catch (error) {
    console.error(error);
  }

  if (response.data) {
    return response.data;
  } else {
    console.error(new Error('no data in response'));
  }
}

function parseServerChartData(data) {
  return data.map((dataItem) => ({
      date: new Date(dataItem[0]),
      gdp: dataItem[1],
    })
  );
}

function createBarChart(dataset): void {
  let svg = d3
    .select('#chart-bar')
    .append('svg')
    .attr('width', CHART_WIDTH)
    .attr('height', CHART_HEIGHT);

  let scales = createScales(dataset);
  createAxes(svg, scales);

  let barsD3 = svg
    .selectAll('rect')
    .data(dataset)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', (d) => scales.xScale(d.date))
    .attr('y', (d) => scales.yScale(d.gdp))
    .attr('width', CHART_WIDTH / dataset.length - 0.6)
    .attr('height', (d) => CHART_HEIGHT - CHART_PADDING - scales.yScale(d.gdp))
    .attr('data-date', ({date}) => formatDate(date, DATE_FORMAT))
    .attr('data-gdp', ({gdp}) => gdp);

  let tooltip = document.getElementById('tooltip');
  let tooltipDate: HTMLElement = document.createElement('h2');
  tooltip.appendChild(tooltipDate);
  let tooltipGDP: HTMLElement = document.createElement('div');
  tooltip.appendChild(tooltipGDP);

  barsD3.on('mouseenter', ({date, gdp}) => {
    tooltip.classList.add('tooltip_visibility_visible');
    tooltip.style.left = `${scales.xScale(date) / (CHART_WIDTH / 100)}%`;
    tooltip.dataset.date = formatDate(date, DATE_FORMAT);
    tooltipDate.textContent = `${formatDate(date, 'YYYY Q')}Q`;
    tooltipGDP.textContent = `${gdp} Billions`;
  });
  barsD3.on('mouseleave', () => {
    tooltip.classList.remove('tooltip_visibility_visible');
    tooltip.style.left = null;
    delete tooltip.dataset.date;
    tooltipDate.textContent = null;
    tooltipGDP.textContent = null;
  });
}

function createScales(dataset) {
  let xScale = d3
    .scaleTime()
    .domain([
      d3.min(dataset, (d) => d.date),
      d3.max(dataset, (d) => d.date),
    ])
    .range([CHART_PADDING, CHART_WIDTH - CHART_PADDING]);
  let yScale = d3
    .scaleLinear()
    .domain([0, d3.max(dataset, (d) => d.gdp)])
    .range([CHART_HEIGHT - CHART_PADDING, CHART_PADDING]);

  return {
    xScale,
    yScale,
  };
}

function createAxes(svg, {xScale, yScale}) {
  let xAxis = d3.axisBottom(xScale);
  let yAxis = d3.axisLeft(yScale);
  svg
    .append('g')
    .attr('id', 'x-axis')
    .attr('transform', `translate(0, ${CHART_HEIGHT - CHART_PADDING})`)
    .call(xAxis);
  svg
    .append('g')
    .attr('id', 'y-axis')
    .attr('transform', `translate(${CHART_PADDING}, 0)`)
    .call(yAxis);
}
