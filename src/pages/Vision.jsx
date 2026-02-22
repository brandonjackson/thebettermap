import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell
} from 'recharts';
import './Vision.css';

const housingData = [
  { year: '2014-15', completions: 170690 },
  { year: '2015-16', completions: 189650 },
  { year: '2016-17', completions: 217350 },
  { year: '2017-18', completions: 222190 },
  { year: '2018-19', completions: 241130 },
  { year: '2019-20', completions: 242700 },
  { year: '2020-21', completions: 216490 },
  { year: '2021-22', completions: 232820 },
  { year: '2022-23', completions: 234400 },
  { year: '2023-24', completions: 221070 },
];

const TARGET = 300000;

function formatNumber(n) {
  return n.toLocaleString('en-GB');
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="vision-tooltip">
      <p className="vision-tooltip-label">{label}</p>
      <p className="vision-tooltip-value">
        {formatNumber(payload[0].value)} homes completed
      </p>
    </div>
  );
}

export default function Vision() {
  return (
    <div className="vision">
      <article className="vision-article">

        <header className="vision-hero">
          <p className="vision-eyebrow">The challenge before us</p>
          <h1 className="vision-title">
            Britain needs to build.
          </h1>
          <p className="vision-subtitle">
            Decades of under-building have created a housing shortage that affects
            every community in the country. The gap between the homes we have and
            the homes we need is vast, growing, and urgent.
          </p>
        </header>

        <section className="vision-stat-block">
          <div className="vision-stat">
            <span className="vision-stat-number">4.3m</span>
            <span className="vision-stat-label">
              homes needed to end the UK housing crisis
            </span>
          </div>
        </section>

        <section className="vision-section">
          <p>
            The numbers are stark. England alone needs roughly 300,000 new homes
            every year just to keep pace with demand. We have not hit that target
            in a single year since the 1970s. The result is a generation locked
            out of home ownership, rising rents consuming ever-larger shares of
            income, and communities unable to grow, adapt, or thrive.
          </p>
          <p>
            Behind every statistic is a family doubling up with relatives, a key
            worker commuting hours because they cannot afford to live near their
            workplace, a young person whose ambitions are constrained not by
            talent but by postcode. This is not an abstract policy problem. It is
            the defining domestic challenge of our time.
          </p>
        </section>

        <section className="vision-section">
          <h2 className="vision-section-title">A decade of falling short</h2>
          <p className="vision-chart-intro">
            Net additional dwellings completed per year in England, against the
            government's 300,000-home annual target.
          </p>
          <div className="vision-chart-wrapper">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart
                data={housingData}
                margin={{ top: 16, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e5e0"
                  vertical={false}
                />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 12, fill: '#666' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e5e0' }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#666' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  domain={[0, 350000]}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={TARGET}
                  stroke="#C45B4A"
                  strokeDasharray="6 4"
                  strokeWidth={2}
                  label={{
                    value: '300k target',
                    position: 'right',
                    fill: '#C45B4A',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
                <Bar dataKey="completions" radius={[2, 2, 0, 0]}>
                  {housingData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.completions >= TARGET ? '#2D6A4F' : '#5B7FC4'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="vision-chart-source">
            Source: DLUHC, Net additional dwellings, England
          </p>
        </section>

        <blockquote className="vision-pullquote">
          <p>How might we unblock our collective imagination?</p>
        </blockquote>

        <section className="vision-section">
          <p>
            The barriers to building are not only material. They are failures of
            imagination. We have forgotten how to picture what our towns could
            become. Planning debates have become adversarial, pitting neighbours
            against one another instead of inviting them to dream together.
          </p>
          <p>
            What if we could see the potential? What if every resident could
            visualise how a neglected car park could become homes, how an empty
            shop front could become a community hub, how their high street could
            come alive again?
          </p>
        </section>

        <section className="vision-section vision-cta">
          <h2 className="vision-section-title">This is our tool</h2>
          <p>
            Progress Map exists to make the future visible. To give communities a
            shared canvas where they can identify opportunities, imagine
            possibilities, and celebrate progress. Not top-down. Not abstract.
            Street by street. Town by town.
          </p>
          <p>
            We believe that when people can see what's possible, they stop
            blocking and start building. That the housing crisis won't be solved
            in Whitehall alone — it will be solved in ten thousand local
            conversations, one site at a time.
          </p>
          <p className="vision-closing">
            <strong>The map is empty. Help us fill it in.</strong>
          </p>
        </section>

      </article>
    </div>
  );
}
