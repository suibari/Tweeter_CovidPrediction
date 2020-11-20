function main() {
  var CSV_DOWNLOAD_URL = "https://storage.googleapis.com/covid-external/forecast_JAPAN_PREFECTURE_28.csv";
  
  // CSVファイル取得
  options = {
    method : "get"
  };
  response = UrlFetchApp.fetch(CSV_DOWNLOAD_URL, options);
  var content = response.getContentText("UTF-8");
  
  // 二次元配列にパース
  var values = Utilities.parseCsv(content);
  
  // forecast_dateを得る
  var forecast_date = values[1][19]; // 一番上の行から適当に
  
  // 本日の日付をyyyy-mm-ddで取得
  var today = formatDate(new Date());
  
  // 県名と日付から感染者数を得る
  var confirmed = getConfirmedNum(values, "東京都", today);
  console.log(confirmed);
  
  // twitter投稿
  var service  = twitter.getService();
  var status = "本日の新型コロナウイルス(COVID-19)感染者予報です。(" + today + ")" + "\n" +
                "\n" +
                "#東京都 "   + getConfirmedNum(values, "東京都", today) + "人" + "\n" +
                "#神奈川県 " + getConfirmedNum(values, "神奈川県", today) + "人" + "\n" +                
                "#北海道 "   + getConfirmedNum(values, "北海道", today) + "人" + "\n" +
                "#愛知県 "   + getConfirmedNum(values, "愛知県", today) + "人" + "\n" +
                "#長野県 "   + getConfirmedNum(values, "長野県", today) + "人" + "\n" +
                "#山口県 "   + getConfirmedNum(values, "山口県", today) + "人" + "\n" +
                "\n" +
                "(データ引用元:Google、予報発表日" + forecast_date + ")" + "\n" +
                "#新型コロナウイルス #COVID19";
  var response = service.fetch('https://api.twitter.com/1.1/statuses/update.json', {
    method: 'post',
    payload: { status: status}
  });
  
  // シートに反映しとく
  SpreadsheetApp.getActiveSheet().getRange(1, 1, values.length, values[0].length).setValues(values);
}

function getConfirmedNum (values, pref, date) {
  // 24列目が県名と一致する行すべて取得
  var values_pref = values.filter(function(row) {
    return (row[24] == pref)
  });
  
  // その中から2列目が日付と一致する行1つ選択
  var values_date = values_pref.filter(function(row) {
    return (row[2] == date)
  });

  // その中から21列目の値(新規感染者数)を取得
  var confirmed = Math.round(values_date[0][21]);
  console.log(confirmed);
  
  return confirmed;
}

function formatDate(dt) {
  var y = dt.getFullYear();
  var m = ('00' + (dt.getMonth()+1)).slice(-2);
  var d = ('00' + dt.getDate()).slice(-2);
  return (y + '-' + m + '-' + d);
}

