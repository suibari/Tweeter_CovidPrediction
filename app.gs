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
  
  // 前回更新時のforecast_dateを得る
  var forecast_date_old = SpreadsheetApp.getActiveSheet().getRange(2, 20).getValue();
  forecast_date_old = formatDate(forecast_date_old);
  
  if (forecast_date != forecast_date_old) {
    // 更新されてるのでTwitter投稿&シート更新
    // 本日の日付をyyyy-mm-ddで取得
    var today = formatDate(new Date());
  
    // twitter投稿
    var service  = twitter.getService();
    var status = "Google AIによる本日のコロナ感染予報です。(" + today + ")" + "\n" +
                 "\n" +
                 "#東京都 "   + getConfirmedByPref(values, "東京都", today) + "人" + "\n" +
                 "#神奈川県 " + getConfirmedByPref(values, "神奈川県", today) + "人" + "\n" +                
                 "#北海道 "   + getConfirmedByPref(values, "北海道", today) + "人" + "\n" +
                 "#愛知県 "   + getConfirmedByPref(values, "愛知県", today) + "人" + "\n" +
                 "#大阪府 "   + getConfirmedByPref(values, "大阪府", today) + "人" + "\n" +
                 "#長野県 "   + getConfirmedByPref(values, "長野県", today) + "人" + "\n" +
                 "#山口県 "   + getConfirmedByPref(values, "山口県", today) + "人" + "\n" +
                 "日本全国: " + getConfirmedTotal(values, today) + "人" + "\n" +
                 "\n" +
                 "(予報発表日: " + forecast_date + ")" + "\n" +
                 "引用元: " + "https://datastudio.google.com/reporting/8224d512-a76e-4d38-91c1-935ba119eb8f/page/ncZpB" + "\n" +
                 "#新型コロナウイルス #COVID19";
    //var status_length = status.length;
    var response = service.fetch('https://api.twitter.com/1.1/statuses/update.json', {
      method: 'post',
      payload: { status: status }
    });
  
    // シートに反映しとく
    SpreadsheetApp.getActiveSheet().getRange(1, 1, values.length, values[0].length).setValues(values);
    
  } else {
    // 更新されてないのでログに出力するだけ
    console.log("don't update because of stable forecast_date: " + forecast_date);
  }
}

function getConfirmedByPref (values, pref, date) {
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

function getConfirmedTotal(values, date) {
  // 日付が一致する行すべて選択
  var values_date = values.filter(function(row) {
    return (row[2] == date)
  });
  
  // 得られた配列の21列目を合計
  var confirmed_total = 0;
  values_date.map(function(row) {
    confirmed_total = confirmed_total + Number(row[21]); // 感染者数はString扱いなのでNumberにキャスト
  });
  
  confirmed_total = Math.round(confirmed_total);
  
  return confirmed_total;
}

function formatDate(dt) {
  var y = dt.getFullYear();
  var m = ('00' + (dt.getMonth()+1)).slice(-2);
  var d = ('00' + dt.getDate()).slice(-2);
  return (y + '-' + m + '-' + d);
}

