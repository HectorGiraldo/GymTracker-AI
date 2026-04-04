import { Component, OnInit, ElementRef, ViewChild, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistoryService } from '../../core/services/history.service';
import * as d3 from 'd3';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss'
})
export class HistoryComponent implements OnInit {
  private historyService = inject(HistoryService);
  
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;

  workouts = this.historyService.pastWorkouts;
  stats = this.historyService.stats;
  
  // Calendar generation
  calendarDays: { date: number | null, isWorkout: boolean, isPartial: boolean, isToday: boolean }[] = [];
  currentMonthName = '';

  showAllHistory = false;

  constructor() {
    effect(() => {
      // This effect runs whenever pastWorkouts or chartData changes
      this.generateCalendar();
      this.renderChart();
    });
  }

  ngOnInit() {
    // Initial generation is handled by the effect
  }

  toggleHistory() {
    this.showAllHistory = !this.showAllHistory;
  }

  onFeatureNotImplemented(feature: string) {
    alert(`La función "${feature}" estará disponible próximamente. Requerirá guardar la rutina completa en tu perfil.`);
  }

  generateCalendar() {
    this.calendarDays = [];
    const today = new Date();
    this.currentMonthName = today.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    
    const year = today.getFullYear();
    const month = today.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1; // Adjust for Monday start (0 is Sunday)

    // Add empty slots for the offset
    for (let i = 0; i < offset; i++) {
      this.calendarDays.push({ date: null, isWorkout: false, isPartial: false, isToday: false });
    }

    const workouts = this.workouts();

    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      const isToday = i === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      
      const workoutOnDay = workouts.find(w => 
        w.date.getDate() === i && 
        w.date.getMonth() === month && 
        w.date.getFullYear() === year
      );

      this.calendarDays.push({
        date: i,
        isWorkout: !!workoutOnDay && workoutOnDay.completedExercises === workoutOnDay.totalExercises,
        isPartial: !!workoutOnDay && workoutOnDay.completedExercises < workoutOnDay.totalExercises,
        isToday
      });
    }
  }

  renderChart() {
    const data = this.historyService.chartData();
    const element = this.chartContainer?.nativeElement;
    
    if (!element) return;
    
    d3.select(element).selectAll('*').remove(); // Clear previous

    if (!data.length) return;

    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = element.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(element)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .range([0, width])
      .padding(0.1)
      .domain(data.map(d => d.date));

    const y = d3.scaleLinear()
      .range([height, 0])
      .domain([0, d3.max(data, d => d.volume) || 10000]);

    // Add X axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('class', 'text-xs text-gray-500');

    // Add Y axis
    svg.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .attr('class', 'text-xs text-gray-500');

    // Add bars
    svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.date) || 0)
      .attr('width', x.bandwidth())
      .attr('y', d => y(d.volume))
      .attr('height', d => height - y(d.volume))
      .attr('fill', '#ccff00')
      .attr('rx', 4); // rounded corners
  }
}
