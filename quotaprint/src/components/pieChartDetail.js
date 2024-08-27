import * as React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { Typography } from '@mui/material';

function PieChartDetail({ data }) {
  const pieData = [
    { 
      id: 1, 
      value: data.blackWhite, 
      label: `Black & White: ${data.blackWhite}` 
    },
    { 
      id: 2, 
      value: data.color, 
      label: `Color: ${data.color}`
    },
  ];

  return (
    <div>
      <Typography variant="h6">{data.requester}</Typography>
      <PieChart
        series={[
          {
            data: pieData,
            highlightScope: { faded: 'global', highlighted: 'item' },
            faded: { innerRadius: 20, additionalRadius: -5, color: 'gray' },
          },
        ]}
        height={200}
      />
    </div>
  );
}

export default PieChartDetail;
