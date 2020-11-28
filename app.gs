function main() {
  var CSV_DOWNLOAD_URL = "https://storage.googleapis.com/covid-external/forecast_JAPAN_PREFECTURE_28.csv";
  var service  = twitter.getService();
  
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
  
  // 本日の日付をyyyy-mm-ddで取得
  var date  = new Date()
  var today = formatDate(date);
  var date_aft2w = new Date(date.setDate(date.getDate() + 14));
  var aft2w      = formatDate(date_aft2w);
  
  //if (1) {
  if (forecast_date != forecast_date_old) {
    // 更新されてるのでTwitter投稿&シート更新
  
    // twitter投稿(感染者予報)
    var status = "💊コロナ感染予報byGoogleAI(" + today + ")" + "\n" +
                 "#東京都 "   + getConfirmedByPref(values, "東京都", today)  + "/" + getConfirmedByPref(values, "東京都", aft2w)+ "/"   + "+" + getConfirmedDensity(values, "東京都", today)   + "\n" +
                 "#神奈川県 " + getConfirmedByPref(values, "神奈川県", today) + "/" + getConfirmedByPref(values, "神奈川県", aft2w)+ "/" + "+" + getConfirmedDensity(values, "神奈川県", today) + "\n" +                
                 "#北海道 "   + getConfirmedByPref(values, "北海道", today)  + "/" + getConfirmedByPref(values, "北海道", aft2w)+ "/"   + "+" + getConfirmedDensity(values, "北海道", today)   + "\n" +
                 "#愛知県 "   + getConfirmedByPref(values, "愛知県", today)  + "/" + getConfirmedByPref(values, "愛知県", aft2w)+ "/"   + "+" + getConfirmedDensity(values, "愛知県", today)   + "\n" +
                 //"#大阪府 "   + getConfirmedByPref(values, "大阪府", today)  + "/" + getConfirmedByPref(values, "大阪府", aft2w)+ "/"   + "+" + getConfirmedDensity(values, "大阪府", today)   + "\n" +
                 "#長野県 "   + getConfirmedByPref(values, "長野県", today)  + "/" + getConfirmedByPref(values, "長野県", aft2w)+ "/"   + "+" + getConfirmedDensity(values, "長野県", today)   + "\n" +
                 "#山口県 "   + getConfirmedByPref(values, "山口県", today)  + "/" + getConfirmedByPref(values, "山口県", aft2w)+ "/"   + "+" + getConfirmedDensity(values, "山口県", today)   + "\n" +
                 "日本全国: " + getConfirmedTotal(values, today) + "人/" + getConfirmedTotal(values, aft2w) + "人" + "\n" +
                 "(本日/2w後/感染密度[%/km^2])" + "\n" +
                 "\n" +
                 "予報発表日: " + forecast_date + "\n" +
                 //"引用元: " + "https://datastudio.google.com/reporting/8224d512-a76e-4d38-91c1-935ba119eb8f/page/ncZpB" + "\n" +
                 "#COVID19";
    var response = service.fetch('https://api.twitter.com/1.1/statuses/update.json', {
      method: 'post',
      payload: { status: status }
    });
    Logger.log(response);
  
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

function getConfirmedDensity(value, pref, date) {
  // 人口密度: 引用元はhttps://uub.jp/rnk/p_j.html
  var pop_den_tokyo     = 6367.67;
  var pop_den_kanagawa  = 3813.30;
  var pop_den_osaka     = 4627.76;
  var pop_den_hokkaido  = 66.47;
  var pop_den_aichi     = 1457.77;
  var pop_den_nagano    = 149.99;
  var pop_den_yamaguchi = 219.47;
  
  var confirmed = getConfirmedByPref(value, pref, date);
  if (pref == "東京都") {
    var confirmed_density = confirmed / pop_den_tokyo;
  } else if (pref == "神奈川県") {
    var confirmed_density = confirmed / pop_den_kanagawa;
  } else if (pref == "大阪府") {
    var confirmed_density = confirmed / pop_den_osaka;
  } else if (pref == "北海道") {
    var confirmed_density = confirmed / pop_den_hokkaido;
  } else if (pref == "愛知県") {
    var confirmed_density = confirmed / pop_den_aichi;
  } else if (pref == "長野県") {
    var confirmed_density = confirmed / pop_den_nagano;
  } else if (pref == "山口県") {
    var confirmed_density = confirmed / pop_den_yamaguchi;
  }
  return 100 * Math.round(confirmed_density*1000)/1000;
}

function formatDate(dt) {
  var y = dt.getFullYear();
  var m = ('00' + (dt.getMonth()+1)).slice(-2);
  var d = ('00' + dt.getDate()).slice(-2);
  return (y + '-' + m + '-' + d);
}

