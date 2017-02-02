<NumberFormat value={count} />;
<NumberFormat value={count} format="percent" />;
<NumberFormat value={count} format={{
  style: 'percent'
}} />;
<DateFormat value={count} format={{ era: 'long' }} />;
<Trans>
  <NumberFormat value={count} format={{ style: 'percent' }} />
  <NumberFormat value={count} format={{ style: 'percent' }} />
  <NumberFormat value={count} format={{ style: 'percent' }} />
</Trans>;
