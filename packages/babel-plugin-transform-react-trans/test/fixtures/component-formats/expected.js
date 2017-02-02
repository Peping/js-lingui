<Trans id="{count, number}" />;
<Trans id="{count, number, percent}" />;
<Trans id="{count, number, style_percent}" formats={{
  style_percent: {
    style: 'percent'
  }
}} />;
<Trans id="{count, date, format}" formats={{
  format: { era: 'long' }
}} />;
<Trans id="{count, number, style_percent}\n{count, number, style_percent_1}\n{count, number, style_percent_2}" formats={{
  style_percent: { style: 'percent' },
  style_percent_1: { style: 'percent' },
  style_percent_2: { style: 'percent' }
}} />;
