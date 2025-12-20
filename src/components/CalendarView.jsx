import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CalendarView({ events, onEventClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
          <div className="flex items-center rounded-md border border-slate-200 bg-white">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 rounded-r-none">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="w-px h-4 bg-slate-200" />
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-l-none">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-fr bg-slate-200 gap-px">
        {days.map(day => {
          const dayEvents = events.filter(e => e.date && isSameDay(parseISO(e.date), day));
          const isCurrentMonth = isSameMonth(day, monthStart);
          
          return (
            <div 
              key={day.toString()} 
              className={`min-h-[120px] bg-white p-2 ${!isCurrentMonth ? 'bg-slate-50/50' : ''}`}
            >
              <div className={`text-right mb-2 text-sm ${isToday(day) ? 'font-bold text-indigo-600' : 'text-slate-500'}`}>
                <span className={`${isToday(day) ? 'bg-indigo-50 px-2 py-0.5 rounded-full' : ''}`}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="space-y-1">
                {dayEvents.map(event => (
                  <div 
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className={`
                      text-xs p-1.5 rounded cursor-pointer truncate border-l-2 transition-all hover:opacity-80
                      ${event.type === 'lead' 
                        ? 'bg-orange-50 text-orange-700 border-orange-400' 
                        : 'bg-purple-50 text-purple-700 border-purple-400'}
                    `}
                  >
                    <span className="font-semibold">{format(parseISO(event.date), 'h:mma')}</span> {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}