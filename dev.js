const axios = require('axios');
const prompt = require('prompt');
const moment = require('moment');

prompt.start();

const getHttpUrl = version => (
  `https://mix.lottery.sina.com.cn/gateway/index/entry?callback=cbitem1&__caller__=web&__verno__=1&__version__=1&cat1=gameOpenInfo&format=json&lottoType=104&issueNo=${version}&dpc=1`
);

prompt.get([{
  name: 'version',
  description: '从开奖第几期开始',
  type: 'string',
  default: '2023146',
}], function (error, results) {
  const version = results.version;
  typeof version === "string" && getWholeHappyEightResult(version, analyzeResult);
});

function getWholeHappyEightResult(startVersion, callback) {
  const warehouse = new Map();
  function collectWholeResultFromGoal({version, collect, preVersion}) {
    return new Promise(resolve => {
      axios.get(getHttpUrl(version))
        .then(res => {
          eval(res.data);
          function cbitem1(params) {
            const {openResults, issueNo: curVersion, nextIssueNo: nextVersion, nextOpenTime} = params.result.data;

            collect.set(curVersion, {openResults, curVersion, nextVersion, nextOpenTime, preVersion});
            if (moment(nextOpenTime).isBefore(moment())) {
              collectWholeResultFromGoal({version: nextVersion, collect, preVersion: version})
                .then(resolve);
            } else {
              resolve(collect);
            }
          }
        });
    })
  }

  collectWholeResultFromGoal({version: startVersion, collect: warehouse})
    .then(callback);
}

function analyzeResult(collect) {
  const analyzeResult = ['开始计算重复的数字'];
  let curRepeat = [];
  const repeatValue = (curOpenLottery, nextOpenLottery) => (
    curOpenLottery.filter(lottery => nextOpenLottery.includes(lottery))
  );
  collect.forEach(curHappyEightInfo => {
    const {openResults: openResult, preVersion, curVersion} = curHappyEightInfo;

    if (curRepeat.length) {
      curRepeat = repeatValue(curRepeat, openResult);
      analyzeResult.push({
        preVersion,
        curVersion,
        repeatContent: curRepeat,
      });
      if (curRepeat.length === 0) {
        analyzeResult.push('重新开始统计重复的数字');
        curRepeat = openResult;
      }
    } else {
      curRepeat = openResult;
    }
  });

  console.log(analyzeResult);
}
