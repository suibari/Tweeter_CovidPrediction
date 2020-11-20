var twitter = TwitterWebService.getInstance(
  PropertiesService.getScriptProperties().getProperty('CONSUMER_KEY'), 
  PropertiesService.getScriptProperties().getProperty('CONSUMER_SECRET') 
);