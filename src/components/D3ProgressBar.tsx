import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface D3ProgressBarProps {
  mastered: number;
  total: number;
  width?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
}

export const D3ProgressBar: React.FC<D3ProgressBarProps> = ({
  mastered,
  total,
  width = 120,
  height = 8,
  color = 'var(--theme-accent)', // Theme accent
  backgroundColor = 'rgba(120, 113, 108, 0.2)' // stone-500 with opacity
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || total === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous drawing

    // Setup scale
    const xScale = d3.scaleLinear().domain([0, total]).range([0, width]);

    // Add background bar
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('rx', height / 2) // rounded corners
      .attr('ry', height / 2)
      .attr('fill', backgroundColor);

    // Add foreground (progress) bar
    svg.append('rect')
      .attr('width', 0) // start at 0 for animation
      .attr('height', height)
      .attr('rx', height / 2)
      .attr('ry', height / 2)
      .attr('fill', color)
      .transition()
      .duration(800)
      .ease(d3.easeCubicOut)
      .attr('width', xScale(mastered));

  }, [mastered, total, width, height, color, backgroundColor]);

  if (total === 0) {
    return <div className="text-[10px] text-stone-400 font-medium">No cards</div>;
  }

  const percentage = Math.round((mastered / total) * 100);

  return (
    <div className="flex items-center gap-2" title={`${mastered} out of ${total} cards mastered (${percentage}%)`}>
      <svg ref={svgRef} width={width} height={height} className="rounded-full" />
      <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400">
        {percentage}%
      </span>
    </div>
  );
};
