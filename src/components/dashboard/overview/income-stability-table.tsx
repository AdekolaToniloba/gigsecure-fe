type IncomeStabilityTableProps = {
  points: readonly number[];
};

const valueFormatter = new Intl.NumberFormat('en-NG', {
  maximumFractionDigits: 2,
});

export function IncomeStabilityTable({ points }: IncomeStabilityTableProps) {
  if (points.length === 0) {
    return <p className="text-sm text-slate-600">No trend observations are available.</p>;
  }

  return (
    <div className="max-h-52 min-w-0 overflow-y-auto rounded-lg border border-app-border">
      <table className="w-full table-fixed border-collapse text-left text-sm">
        <caption className="sr-only">Income stability trend observations</caption>
        <thead className="sticky top-0 bg-app-sidebar text-primary">
          <tr>
            <th scope="col" className="w-1/2 px-4 py-2 font-semibold">Observation</th>
            <th scope="col" className="w-1/2 px-4 py-2 font-semibold">Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-app-border bg-white text-slate-700">
          {points.map((point, index) => (
            <tr key={index}>
              <th scope="row" className="px-4 py-2 font-medium text-primary">
                {index + 1}
              </th>
              <td className="break-words px-4 py-2 [overflow-wrap:anywhere]">
                {valueFormatter.format(point)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
