export default function (/* props: Props */) {

  return(
    <div>
      <table border={1}>
        <tbody>
          <tr>
            <td>aria-label</td>
            <td>
              <button aria-label="Test Label 1">&nbsp;</button>
            </td>
          </tr>
          <tr>
            <td>aria-labelledby</td>
            <td>
              <button aria-labelledby="label2 label3">&nbsp;</button>
            </td>
          </tr>
          <tr>
            <td>aria-description</td>
            <td>
              <button aria-description="Test Description 1">&nbsp;</button>
            </td>
          </tr>
          <tr>
            <td>aria-describedby</td>
            <td>
              <button aria-describedby="desc2 desc3">&nbsp;</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div id="label2">Test Label 2</div>
      <div id="label3">Another Label</div>
      <div id="desc2">Test Description 2</div>
      <div id="desc3">Another Description </div>
    </div>
  );
}
