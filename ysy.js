/*
软件名称:萤石云视频

多账户ck用@隔开，变量：export ysyiphone='account=139xxxxxxxx&featureCode=xxxxx&password=xxxxx@account=158yyyyyyyy&featureCode=yyyy&password=yyyy'
默认所有账户提现到同一个支付宝，变量：export ysytx='receiverId=xxxxx'
默认20点提现，要改变请设置变量：export ysytxTime='21'
按剩余萤豆和提现金额排序提现

*/
const $ = new Env('萤石云视频');
let status;

status = (status = ($.getval("ysystatus") || "1")) > 1 ? `${status}` : "";
let ysyiphoneArr = [], txbodyArr = [], userCount = 0, aliCount = 0

let userIdx = 0
let randomAliIdx = 0
let userStatus = []
let userRemainList = []
let withdrawList = []
let isWithdrawSuccess = false
let withdrawNum = 0

let ysyiphone = $.isNode() ? (process.env.ysyiphone  ? process.env.ysyiphone  : "") : ($.getdata('ysyiphone') ? $.getdata('ysyiphone') : "")
let txbody = $.isNode() ? (process.env.ysytx  ? process.env.ysytx  : "") : ($.getdata('ysytx') ? $.getdata('ysytx') : "")
let txTime = ($.isNode() ? process.env.ysytxTime : $.getdata('ysytxTime')) || 20
let revId = []
let b = Math.round(new Date().getTime() / 1000).toString();
let DD = RT(2000, 3500)
let tz = ($.getval('tz') || '1');
let tx = ($.getval('tx') || '1');

let id = '', bizid = ''
$.message = ''
let ysyiphones = "",txbodys = ""




!(async () => {
    if (typeof $request !== "undefined") {
        await ysyck()
    } else {
        if(!ysyiphone) {
            console.log('没有找到ysyiphone')
            return
        }
        if (ysyiphone.indexOf('@') > -1) {
            let splitList = ysyiphone.split('@');
            console.log(`您选择的是用"@"隔开ysyiphone\n`)
            for(let item of splitList) {
                if(item) ysyiphoneArr.push(item)
            }
        } else {
            ysyiphoneArr = [ysyiphone]
        };
        userCount = ysyiphoneArr.length

        if(txbody) {
            if(txbody.indexOf('@') > -1) {
                txbodyArr = txbody.split('@')
                console.log(`您选择的是用"@"隔开ysytx\n`)
                for(let item of txbodyArr) {
                    let matchItem = item.match(/receiverId=(\w+)/)
                    if(matchItem[1]) revId.push(matchItem[1])
                }
            } else {
                let matchItem = txbody.match(/receiverId=(\w+)/)
                if(matchItem[1]) revId.push(matchItem[1])
            }
            aliCount = revId.length
            randomAliIdx = Math.floor(Math.random()*aliCount)
        }
        
        console.log(`共找到${userCount}个萤石云ck, ${aliCount}个支付宝账号`)
        await RunMultiAccount()
    }
})()

    .catch((e) => $.logErr(e))
    .finally(() => $.done())




async function RunMultiAccount() {
    console.log('\n开始登录账号，请等待...')
    for (userIdx = 0; userIdx < userCount; userIdx++) {
        let userItem = {
            uPhone: '',
            uFeatureCode: '',
            uPassword: '',
            uStatus: 0,
            uSessionId: '',
            uUsername: '',
            needSign: 0,
            needUpVideo: 0,
            needCommentVideo: 0,
            needAdVideo: 0,
            needBox: 0,
            needBlindBox: 0,
            needDoubleBlindBox: 0,
            blindBoxBizid: 0
        }
        userItem.uPhone = ysyiphoneArr[userIdx].match(/account=(\w+)/)[1]
        userItem.uFeatureCode = ysyiphoneArr[userIdx].match(/featureCode=(\w+)/)[1]
        userItem.uPassword = ysyiphoneArr[userIdx].match(/password=(\w+)/)[1]
        userStatus.push(userItem)
        await ysylogin()
    }
    
    await $.wait(Math.floor(Math.random()*2000)+2000)
    
    console.log('\n开始查询任务，宝箱和盲盒状态，请等待...')
    for (userIdx = 0; userIdx < userCount; userIdx++) {
        if(userStatus[userIdx].uStatus == 1) await ysytaskList()
    }
    await $.wait(Math.floor(Math.random()*2000)+2000)
    for (userIdx = 0; userIdx < userCount; userIdx++) {
        if(userStatus[userIdx].uStatus == 1) await ysyboxcd()
    }
    await $.wait(Math.floor(Math.random()*2000)+2000)
    for (userIdx = 0; userIdx < userCount; userIdx++) {
        if(userStatus[userIdx].uStatus == 1) await ysyblindbox()
    }
    await $.wait(Math.floor(Math.random()*2000)+2000)
    
    /*
    console.log('\n===== 开始领新手萤豆 =====')
    for (userIdx = 0; userIdx < userCount; userIdx++) {
        if(userStatus[userIdx].uStatus == 1) await ysyNewbie()
    }
    await $.wait(Math.floor(Math.random()*2000)+2000)
    */
    
    console.log('\n===== 开始签到 =====')
    for (userIdx = 0; userIdx < userCount; userIdx++) {
        if(userStatus[userIdx].needSign == 1) await ysysign()
    }
    await $.wait(Math.floor(Math.random()*2000)+2000)
    
    /*
    console.log('\n===== 开始完成上传视频任务 =====')
    for (userIdx = 0; userIdx < userCount; userIdx++) {
        if(userStatus[userIdx].needUpVideo == 1) await ysyvideo()
    }
    await $.wait(Math.floor(Math.random()*2000)+2000)
    */
    
    console.log('\n===== 开始完成评论视频任务 =====')
    for (userIdx = 0; userIdx < userCount; userIdx++) {
        if(userStatus[userIdx].needCommentVideo == 1) await ysyplvideo()
    }
    await $.wait(Math.floor(Math.random()*2000)+2000)
    
    console.log('\n===== 开始完成看激励视频任务 =====')
    for (userIdx = 0; userIdx < userCount; userIdx++) {
        if(userStatus[userIdx].needAdVideo == 1) await ysyspspzyd()
    }
    await $.wait(Math.floor(Math.random()*2000)+2000)
    
    console.log('\n===== 开始开宝箱 =====')
    for (userIdx = 0; userIdx < userCount; userIdx++) {
        if(userStatus[userIdx].needBox == 1) await ysybox()
    }
    await $.wait(Math.floor(Math.random()*2000)+2000)
    
    console.log('\n===== 开始开视频宝箱 =====')
    for (userIdx = 0; userIdx < userCount; userIdx++) {
        if(userStatus[userIdx].needBox == 1) await ysyspbox()
    }
    await $.wait(Math.floor(Math.random()*2000)+2000)
    
    console.log('\n===== 开始开盲盒 =====')
    for (userIdx = 0; userIdx < userCount; userIdx++) {
        if(userStatus[userIdx].needBlindBox == 1) await ysyopenblindbox()
    }
    await $.wait(Math.floor(Math.random()*2000)+2000)
    
    console.log('\n===== 开始开盲盒翻倍 =====')
    for (userIdx = 0; userIdx < userCount; userIdx++) {
        if(userStatus[userIdx].needDoubleBlindBox == 1) await ysyopenblindboxdb()
    }
    await $.wait(Math.floor(Math.random()*2000)+2000)
    
    console.log('\n===== 开始查询账户信息 =====')
    for (userIdx = 0; userIdx < userCount; userIdx++) {
        if(userStatus[userIdx].uStatus == 1) await ysyydinfo()
    }
    await UserInfoByOrder()
    await $.wait(Math.floor(Math.random()*1000)+1000)
    
    if(revId.length > 0) {
        if(nowTimes.getHours() == txTime) {
            console.log('\n===== 开始排序提现 =====')
            await GetWithdrawList()
            await WithdrawByOrder()
        } else {
            console.log(`\n非提现时间，当前设置为每天${txTime}点自动提现`)
        }
    } else {
        console.log(`\n没有找到支付宝账号，不执行提现`)
    }
}

function ysyck() {
    if ($request.url.indexOf("login/v2") > -1) {
        
        const ysyiphone = $request.body['account']
        if (ysyiphone) $.setdata(ysyiphone, `ysyiphone${status}`)
        $.log(ysyiphone)


        $.msg($.name, "", `萤石云${status}获取登录数据成功`)

    }else if($request.url.indexOf("yd/pay") > -1) {
        const txbody = $request.body
        if (txbody) $.setdata(txbody, `txbody${status}`)
        $.log(txbody)
        $.msg($.name, "", `萤石云${status}获取提现数据成功`)
    }
}
//登录
function ysylogin(timeout = 0) {
    return new Promise((resolve) => {
        const sphd ={
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-Hans-CN;q=1",
        "Connection": "keep-alive",
        "Content-Length": "441",
        "Content-Type": "application/x-www-form-urlencoded",
        "Host": "api.ys7.com",
        "User-Agent": "VideoGo/6.2.0 (iPhone; iOS 14.4.1; Scale/3.00)",
        "appId": "ys7","clientNo": "",
        "clientType": "1",
        "clientVersion": "6.2.0.1300371",
        "featureCode": userStatus[userIdx].uFeatureCode,
        "netType": "WIFI",
        "osVersion": "14.4.1",
        "sessionId": "",
        "ssid": ""}
        let url = {
            url: `https://api.ys7.com/v3/users/login/v2`,
            headers: sphd,
            body:`account=${userStatus[userIdx].uPhone}&featureCode=${userStatus[userIdx].uFeatureCode}&password=${userStatus[userIdx].uPassword}`,
        }
        $.post(url, async (err, resp, data) => {
            try {

                const result = JSON.parse(data)

                if (result.meta.code == 200) {
                    //console.log(`账号${userIdx+1}登录：${result.meta.message}，用户名：${result.sessionInfo.userName}，手机号：${userStatus[userIdx].uPhone}`)
                    userStatus[userIdx].uSessionId = result.sessionInfo.sessionId
                    userStatus[userIdx].uUserName = result.sessionInfo.userName
                    userStatus[userIdx].uStatus = 1
                }else{
                    console.log(`账号${userIdx+1}登录：${result.meta.message}，手机号：${userStatus[userIdx].uPhone}`)
                    userStatus[userIdx].uStatus = 0
                }
            } catch (e) {

            } finally {

                resolve()
            }
        }, timeout)
    })
}


//开宝箱冷却查询
function ysyboxcd(timeout = 0) {
    return new Promise((resolve) => {
       

        const sphd ={
            "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Content-Length": "31",
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": `"ASG_DisplayName=${userStatus[userIdx].uUsername}; C_SS=${userStatus[userIdx].uSessionId}; C_TYPE=1; C_VER=6.2.0.1300371;"`,
        "Host": "api.ys7.com",
        "User-Agent": "VideoGo/1262766 CFNetwork/1220.1 Darwin/20.3.0",
        "appid": "ys",
        "clientno": "undefined",
        "clienttype": "1",
        "clientversion": "6.1.3.1262766",
        "featurecode": userStatus[userIdx].uFeatureCode,
        "language": "undefined",
        "nettype": "WIFI",
        "sessionid": userStatus[userIdx].uSessionId
        }
        let url = {
            url: `https://api.ys7.com/v3/integral/yd/getUserOpenBoxCd`,
            headers: sphd,

        }
        $.get(url, async (err, resp, data) => {
            try {

                const result = JSON.parse(data)
                if (result.meta.code == 200) {
                    if(result.expireTime ==0) {
                        userStatus[userIdx].needBox = 1
                        //console.log(`账号${userIdx+1}可以开宝箱`)
                    } else {
                        //console.log(`账号${userIdx+1}宝箱冷却时间未到`)
                    }
                } else {
                    console.log(`账号${userIdx+1}开宝箱冷却查询失败：${result.message}`)
                }
            } catch (e) {

            } finally {

                resolve()
            }
        }, timeout)
    })
}

//开宝箱
function ysybox(timeout = 0) {
    return new Promise((resolve) => {
        

        const sphd ={
            "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Content-Length": "31",
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": `"ASG_DisplayName=${userStatus[userIdx].uUsername}; C_SS=${userStatus[userIdx].uSessionId}; C_TYPE=1; C_VER=6.2.0.1300371;"`,
        "Host": "api.ys7.com",
        "User-Agent": "VideoGo/1262766 CFNetwork/1220.1 Darwin/20.3.0",
        "appid": "ys",
        "clientno": "undefined",
        "clienttype": "1",
        "clientversion": "6.1.3.1262766",
        "featurecode": userStatus[userIdx].uFeatureCode,
        "language": "undefined",
        "nettype": "WIFI",
        "sessionid": userStatus[userIdx].uSessionId
        }
        let url = {
            url: `https://api.ys7.com/v3/integral/yd/openYdBox`,
            headers: sphd,

        }
        $.post(url, async (err, resp, data) => {
            try {

                const result = JSON.parse(data)

                if (result.meta.code == 200) {
                    console.log(`账号${userIdx+1}开宝箱获得莹豆：${result.ydValue}`)
                } else {
                    console.log(`账号${userIdx+1}开宝箱失败：${result.meta.message}`)
                }
            } catch (e) {

            } finally {

                resolve()
            }
        }, timeout)
    })
}




//视频开宝箱
function ysyspbox(timeout = 0) {
    return new Promise((resolve) => {
        

        const sphd ={
            "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Content-Length": "31",
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": `"ASG_DisplayName=${userStatus[userIdx].uUsername}; C_SS=${userStatus[userIdx].uSessionId}; C_TYPE=1; C_VER=6.2.0.1300371;"`,
        "Host": "api.ys7.com",
        "User-Agent": "VideoGo/1262766 CFNetwork/1220.1 Darwin/20.3.0",
        "appid": "ys",
        "clientno": "undefined",
        "clienttype": "1",
        "clientversion": "6.1.3.1262766",
        "featurecode": userStatus[userIdx].uFeatureCode,
        "language": "undefined",
        "nettype": "WIFI",
        "sessionid": userStatus[userIdx].uSessionId
        }
        let url = {
            url: `https://api.ys7.com/v3/integral/task/complete`,
            headers: sphd,
            body:`eventkey=1013&filterParam=12345`,
        }
        $.post(url, async (err, resp, data) => {
            try {

                const result = JSON.parse(data)

                if (result.meta.code == 200) {
                    console.log(`账号${userIdx+1}看视频开宝箱获得莹豆：${result.taskIntegral}`)
                }else{
                    console.log(`账号${userIdx+1}看视频开宝箱获得莹豆失败：${result.meta.message}`)
                }
            } catch (e) {

            } finally {

                resolve()
            }
        }, timeout)
    })
}


//看激励视频赚莹豆
function ysyspspzyd(timeout = 0) {
    return new Promise((resolve) => {
       

        const sphd ={
            "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Content-Length": "31",
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": `"ASG_DisplayName=${userStatus[userIdx].uUsername}; C_SS=${userStatus[userIdx].uSessionId}; C_TYPE=1; C_VER=6.2.0.1300371;"`,
        "Host": "api.ys7.com",
        "User-Agent": "VideoGo/1262766 CFNetwork/1220.1 Darwin/20.3.0",
        "appid": "ys",
        "clientno": "undefined",
        "clienttype": "1",
        "clientversion": "6.1.3.1262766",
        "featurecode": userStatus[userIdx].uFeatureCode,
        "language": "undefined",
        "nettype": "WIFI",
        "sessionid": userStatus[userIdx].uSessionId
        }
        let url = {
            url: `https://api.ys7.com/v3/integral/task/complete`,
            headers: sphd,
            body:`eventkey=1014&filterParam=12345`,
        }
        $.post(url, async (err, resp, data) => {
            try {

                const result = JSON.parse(data)

                if (result.meta.code == 200) {
                    console.log(`账号${userIdx+1}看激励视频获得莹豆：${result.taskIntegral}`)
                }else{
                    console.log(`账号${userIdx+1}看激励视频获得莹豆失败：${result.meta.message}`)
                }
            } catch (e) {

            } finally {

                resolve()
            }
        }, timeout)
    })
}

//任务列表
function ysytaskList(timeout = 0) {
    return new Promise((resolve) => {
        

        const sphd ={
            "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Content-Length": "31",
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": `"ASG_DisplayName=${userStatus[userIdx].uUsername}; C_SS=${userStatus[userIdx].uSessionId}; C_TYPE=1; C_VER=6.2.0.1300371;"`,
        "Host": "api.ys7.com",
        "User-Agent": "VideoGo/1262766 CFNetwork/1220.1 Darwin/20.3.0",
        "appid": "ys",
        "clientno": "undefined",
        "clienttype": "1",
        "clientversion": "6.1.3.1262766",
        "featurecode": userStatus[userIdx].uFeatureCode,
        "language": "undefined",
        "nettype": "WIFI",
        "sessionid": userStatus[userIdx].uSessionId
        }
        let url = {
            url: `https://api.ys7.com/v3/integral/task/list`,
            headers: sphd,
            body: `pageNum=0&pageSize=20&vipId=`,
        }
        $.post(url, async (err, resp, data) => {
            try {

                const result = JSON.parse(data)
                //result.taskList[0].taskCompleteNum
                if (result.meta.code == 200) {
                    if (result.taskList[0].taskCompleteNum != result.taskList[0].taskNum) userStatus[userIdx].needSign = 1
                    if (result.taskList[1].taskCompleteNum != result.taskList[1].taskNum) userStatus[userIdx].needUpVideo = 1
                    if (result.taskList[2].taskCompleteNum != result.taskList[2].taskNum) userStatus[userIdx].needCommentVideo = 1
                    if (result.taskList[4].taskCompleteNum != result.taskList[4].taskNum) userStatus[userIdx].needAdVideo = 1
                } else {
                    console.log(`账号${userIdx+1}查询任务列表失败：${result.meta.message}`)
                }
            } catch (e) {

            } finally {

                resolve()
            }
        }, timeout)
    })
}




//上传短视频任务
function ysyvideo(timeout = 0) {
    return new Promise((resolve) => {
        

        const sphd ={
            "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Content-Length": "31",
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": `"ASG_DisplayName=${userStatus[userIdx].uUsername}; C_SS=${userStatus[userIdx].uSessionId}; C_TYPE=1; C_VER=6.2.0.1300371;"`,
        "Host": "api.ys7.com",
        "User-Agent": "VideoGo/1262766 CFNetwork/1220.1 Darwin/20.3.0",
        "appid": "ys",
        "clientno": "undefined",
        "clienttype": "1",
        "clientversion": "6.1.3.1262766",
        "featurecode": userStatus[userIdx].uFeatureCode,
        "language": "undefined",
        "nettype": "WIFI",
        "sessionid": userStatus[userIdx].uSessionId
        }
        let url = {
            url: `https://api.ys7.com/v3/integral/task/complete?eventkey=1007&filterParam=video`,
            headers: sphd,
   
        }
        $.post(url, async (err, resp, data) => {
            try {

                const result = JSON.parse(data)

                if (result.meta.code == 200) {
                    console.log(`账号${userIdx+1}完成上传短视频获得莹豆：${result.taskIntegral}`)
                } else {
                    console.log(`账号${userIdx+1}完成上传短视频任务失败：${result.meta.message}`)
                }
            } catch (e) {

            } finally {

                resolve()
            }
        }, timeout)
    })
}




//评论短视频任务
function ysyplvideo(timeout = 0) {
    return new Promise((resolve) => {
       

        const sphd ={
            "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Content-Length": "31",
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": `"ASG_DisplayName=${userStatus[userIdx].uUsername}; C_SS=${userStatus[userIdx].uSessionId}; C_TYPE=1; C_VER=6.2.0.1300371;"`,
        "Host": "api.ys7.com",
        "User-Agent": "VideoGo/1262766 CFNetwork/1220.1 Darwin/20.3.0",
        "appid": "ys",
        "clientno": "undefined",
        "clienttype": "1",
        "clientversion": "6.1.3.1262766",
        "featurecode": userStatus[userIdx].uFeatureCode,
        "language": "undefined",
        "nettype": "WIFI",
        "sessionid": userStatus[userIdx].uSessionId
        }
        let url = {
            url: `https://api.ys7.com/v3/integral/task/complete?eventkey=1008&filterParam=video`,
            headers: sphd,
        
        }
        $.post(url, async (err, resp, data) => {
            try {

                const result = JSON.parse(data)

                if (result.meta.code == 200) {
                    console.log(`账号${userIdx+1}评论短视频获得莹豆：${result.taskIntegral}`)
                } else {
                    console.log(`账号${userIdx+1}评论短视频任务失败：${result.meta.message}`)
                }
            } catch (e) {

            } finally {

                resolve()
            }
        }, timeout)
    })
}

//签到任务
function ysysign(timeout = 0) {
    return new Promise((resolve) => {
      

        const sphd ={
            "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Content-Length": "31",
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": `"ASG_DisplayName=${userStatus[userIdx].uUsername}; C_SS=${userStatus[userIdx].uSessionId}; C_TYPE=1; C_VER=6.2.0.1300371;"`,
        "Host": "api.ys7.com",
        "User-Agent": "VideoGo/1262766 CFNetwork/1220.1 Darwin/20.3.0",
        "appid": "ys",
        "clientno": "undefined",
        "clienttype": "1",
        "clientversion": "6.1.3.1262766",
        "featurecode": userStatus[userIdx].uFeatureCode,
        "language": "undefined",
        "nettype": "WIFI",
        "sessionid": userStatus[userIdx].uSessionId
        }
        let url = {
            url: `https://api.ys7.com/v3/videoclips/user/check_in`,
            headers: sphd,
        
        }
        $.post(url, async (err, resp, data) => {
            try {

                const result = JSON.parse(data)

                if (result.meta.code == 200) {
                    console.log(`账号${userIdx+1}签到获得莹豆：${result.data.score}`)
                } else {
                    console.log(`账号${userIdx+1}签到失败：${result.meta.message}`)
                }
            } catch (e) {

            } finally {

                resolve()
            }
        }, timeout)
    })
}


//莹豆信息
function ysyydinfo(timeout = 0) {
    return new Promise((resolve) => {
        

        const sphd ={
            "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Content-Length": "31",
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": `"ASG_DisplayName=${userStatus[userIdx].uUsername}; C_SS=${userStatus[userIdx].uSessionId}; C_TYPE=1; C_VER=6.2.0.1300371;"`,
        "Host": "api.ys7.com",
        "User-Agent": "VideoGo/1262766 CFNetwork/1220.1 Darwin/20.3.0",
        "appid": "ys",
        "clientno": "undefined",
        "clienttype": "1",
        "clientversion": "6.1.3.1262766",
        "featurecode": userStatus[userIdx].uFeatureCode,
        "language": "undefined",
        "nettype": "WIFI",
        "sessionid": userStatus[userIdx].uSessionId
        }
        let url = {
            url: `https://api.ys7.com/v3/integral/yd/queryMainPageInfo?`,
            headers: sphd,
        
        }
        $.get(url, async (err, resp, data) => {
            try {
                const result = JSON.parse(data)
                if (result.meta.code == 200) {
                    userRemainList.push({'usrIdx':userIdx, 'info':result})
                } else {
                    console.log(`账号${userIdx+1}查询莹豆信息失败：${result.meta.message}`)
                }
            } catch (e) {

            } finally {

                resolve()
            }
        }, timeout)
    })
}

//用户信息排序
async function UserInfoByOrder() {
    userRemainList = userRemainList.sort(function(a,b){return b["info"]["ydRemainValue"]-a["info"]["ydRemainValue"]});
    for(let userItem of userRemainList) {
        console.log(`\n====== 账号${userItem.usrIdx+1} ======`)
        console.log(`累计获得莹豆：${userItem.info.ydAccumulateValue}`)
        console.log(`剩余莹豆：${userItem.info.ydRemainValue}`)
        console.log(`今日获得莹豆：${userItem.info.ydCurrValue}`)
        console.log(`累计提现：${userItem.info.ydPayCashValue}`)
    }
}

//提现排序
async function WithdrawByOrder() {
    let sortWithdrawList = withdrawList.sort(function(a,b){return b["amount"]-a["amount"]});
    for(let userItem of userRemainList) {
        userIdx = userItem.usrIdx
        isWithdrawSuccess = false
        for(let withItem of sortWithdrawList) {
            if(userItem.info.ydRemainValue >= withItem.ydValue) await ysytx(withItem.configCode,withItem.amount)
            if(isWithdrawSuccess) break;
        }
    }
}

//获取提现列表
function GetWithdrawList() {
    let randomId = Math.floor(Math.random()*userCount)
    return new Promise((resolve) => {
        const sphd ={
            "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Content-Length": "31",
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": `"ASG_DisplayName=${userStatus[randomId].uUsername}; C_SS=${userStatus[randomId].uSessionId}; C_TYPE=1; C_VER=6.2.0.1300371;"`,
        "Host": "api.ys7.com",
        "User-Agent": "VideoGo/1262766 CFNetwork/1220.1 Darwin/20.3.0",
        "appid": "ys",
        "clientno": "undefined",
        "clienttype": "1",
        "clientversion": "6.1.3.1262766",
        "featurecode": userStatus[randomId].uFeatureCode,
        "language": "undefined",
        "nettype": "WIFI",
        "sessionid": userStatus[randomId].uSessionId
        }
        let url = {
            url: `https://api.ys7.com/v3/integral/yd/queryCashPageInfo`,
            headers: sphd,
        }
        $.get(url, async (err, resp, data) => {
            try {
                const result = JSON.parse(data)
                if (result.meta.code == 200) {
                    withdrawList = result.payConfigInfo
                } else {
                    console.log(`获取提现列表失败：${result.meta.message}`)
                }
            } catch (e) {

            } finally {

                resolve()
            }
        }, 0)
    })
}

//莹豆提现
function ysytx(txid,amount) {
    return new Promise((resolve) => {
        
        let aliId = revId[randomAliIdx%aliCount]
        const sphd ={
            "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Content-Length": "31",
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": `"ASG_DisplayName=${userStatus[userIdx].uUsername}; C_SS=${userStatus[userIdx].uSessionId}; C_TYPE=1; C_VER=6.2.0.1300371;"`,
        "Host": "api.ys7.com",
        "User-Agent": "VideoGo/1262766 CFNetwork/1220.1 Darwin/20.3.0",
        "appid": "ys",
        "clientno": "undefined",
        "clienttype": "1",
        "clientversion": "6.1.3.1262766",
        "featurecode": userStatus[userIdx].uFeatureCode,
        "language": "undefined",
        "nettype": "WIFI",
        "sessionid": userStatus[userIdx].uSessionId
        }
        let url = {
            url: `https://api.ys7.com/v3/integral/yd/pay`,
            headers: sphd,
            body:`payCode=${txid}&receiverType=2&receiverId=${aliId}`,
        
        }
        $.post(url, async (err, resp, data) => {
            try {
                const result = JSON.parse(data)
                if (result.meta.code == 200) {
                    isWithdrawSuccess = true
                    withdrawNum++
                    if(withdrawNum%10==0) {
                        randomAliIdx++
                        withdrawNum = 0
                    }
                    console.log(`账号${userIdx+1}提现${amount}元：${result.meta.message}`)
                } else {
                    console.log(`账号${userIdx+1}提现${amount}元失败：${result.meta.message}`)
                    if(result.meta.message.indexOf('请确认账号和用户名')>-1) {
                        randomAliIdx++
                        withdrawNum = 0
                    }
                }
            } catch (e) {

            } finally {

                resolve()
            }
        }, 0)
    })
}


//盲盒信息
function ysyblindbox(timeout = 0) {
    return new Promise((resolve) => {
       

        const sphd ={
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Cookie": `"ASG_DisplayName=${userStatus[userIdx].uUsername}; C_SS=${userStatus[userIdx].uSessionId}; C_TYPE=1; C_VER=6.2.0.1300371;"`,
        "Host": "api.ys7.com",
        "User-Agent": "VideoGo/1285272 CFNetwork/1220.1 Darwin/20.3.0",
        "appid": "ys",
        "clientno": "undefined",
        "clienttype": "1",
        "clientversion": "6.2.0.1300371",
        "featurecode": userStatus[userIdx].uFeatureCode,
        "language": "undefined",
        "nettype": "WLAN",
        "sessionid": userStatus[userIdx].uSessionId
    }
       
        let url = {
            url: `https://api.ys7.com/v3/integral/yd/blindBoxMainPage`,
            headers: sphd,
        
        }
        $.get(url, async (err, resp, data) => {
            try {

                const result = JSON.parse(data)

                if (result.meta.code == 200) {
                    //console.log(`账号${userIdx+1}剩余开盲盒次数：${result.userRemainCount}`)
                    if(result.userRemainCount>0) userStatus[userIdx].needBlindBox = 1
                } else {
                    console.log(`账号${userIdx+1}查询剩余开盲盒次数失败：${result.meta.message}`)
                }
            } catch (e) {

            } finally {

                resolve()
            }
        }, timeout)
    })
}


//开盲盒
function ysyopenblindbox(timeout = 0) {
    return new Promise((resolve) => {
      

        const sphd ={
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": `"ASG_DisplayName=${userStatus[userIdx].uUsername}; C_SS=${userStatus[userIdx].uSessionId}; C_TYPE=1; C_VER=6.2.0.1300371;"`,
        "Host": "api.ys7.com",
        "User-Agent": "VideoGo/1285272 CFNetwork/1220.1 Darwin/20.3.0",
        "appid": "ys",
        "clientno": "undefined",
        "clienttype": "1",
        "clientversion": "6.2.0.1300371",
        "featurecode": userStatus[userIdx].uFeatureCode,
        "language": "undefined",
        "nettype": "WLAN",
        "sessionid": userStatus[userIdx].uSessionId
    }
        let url = {
            url: `https://api.ys7.com/v3/integral/yd/openBlindBox`,
            headers: sphd,
            body:``,
        
        }
        $.post(url, async (err, resp, data) => {
            try {

                const result = JSON.parse(data)

                if (result.meta.code == 200) {
                    console.log(`账号${userIdx+1}开盲盒获得：${result.blindBoxPrizeInfo.prizeName}`)
                    if(result.blindBoxPrizeInfo.prizeType ==10){
                        userStatus[userIdx].needDoubleBlindBox = 1
                        userStatus[userIdx].blindBoxBizid =result.blindBoxPrizeInfo.bizId
                    }
                } else {
                    console.log(`账号${userIdx+1}开盲盒失败：${result.meta.message}`)
                }
            } catch (e) {

            } finally {

                resolve()
            }
        }, timeout)
    })
}


//开盲盒翻倍
function ysyopenblindboxdb(timeout = 0) {
    return new Promise((resolve) => {
    

        const sphd ={
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": `"ASG_DisplayName=${userStatus[userIdx].uUsername}; C_SS=${userStatus[userIdx].uSessionId}; C_TYPE=1; C_VER=6.2.0.1300371;"`,
        "Host": "api.ys7.com",
        "User-Agent": "VideoGo/1285272 CFNetwork/1220.1 Darwin/20.3.0",
        "appid": "ys",
        "clientno": "undefined",
        "clienttype": "1",
        "clientversion": "6.2.0.1300371",
        "featurecode": userStatus[userIdx].uFeatureCode,
        "language": "undefined",
        "nettype": "WLAN",
        "sessionid": userStatus[userIdx].uSessionId
    }
        let url = {
            url: `https://api.ys7.com/v3/integral/yd/addDoubleYd`,
            headers: sphd,
            body:`bizId=${userStatus[userIdx].blindBoxBizid}&doubleFlag=2`,
        
        }
        $.post(url, async (err, resp, data) => {
            try {

                const result = JSON.parse(data)

                if (result.meta.code == 200) {
                    console.log(`账号${userIdx+1}开盲盒翻倍获得莹豆：${result.blindBoxPrizeInfo.prizePrice}`)
                } else {
                    console.log(`账号${userIdx+1}开盲盒翻倍失败：${result.meta.message}`)
                }
            } catch (e) {

            } finally {

                resolve()
            }
        }, timeout)
    })
}

//新手送萤豆？
function ysyNewbie(timeout = 0) {
    return new Promise((resolve) => {
    

        const sphd ={
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": `"ASG_DisplayName=${userStatus[userIdx].uUsername}; C_SS=${userStatus[userIdx].uSessionId}; C_TYPE=1; C_VER=6.2.0.1300371; use_new_rn=1"`,
        "Host": "api.ys7.com",
        "User-Agent": "VideoGo/1285272 CFNetwork/1220.1 Darwin/20.3.0",
        "appid": "ys",
        "clientno": "undefined",
        "clienttype": "1",
        "clientversion": "6.2.0.1300371",
        "featurecode": userStatus[userIdx].uFeatureCode,
        "language": "undefined",
        "nettype": "WLAN",
        "sessionid": userStatus[userIdx].uSessionId
    }
        let url = {
            url: `https://api.ys7.com/v3/integral/yd/send`,
            headers: sphd,
            body:`sendCode=100003`,
        
        }
        $.post(url, async (err, resp, data) => {
            try {

                const result = JSON.parse(data)

                if (result.meta.code == 200) {
                    console.log(`账号${userIdx+1}获得新手莹豆奖励：${result.sendYdValue}`)
                } else {
                    console.log(`账号${userIdx+1}获得新手莹豆奖励失败：${result.meta.message}`)
                }
            } catch (e) {

            } finally {

                resolve()
            }
        }, timeout)
    })
}



function message() {
    if (tz == 1) { $.msg($.name, "", $.message) }
}
//时间
nowTimes = new Date(
    new Date().getTime() +
    new Date().getTimezoneOffset() * 60 * 1000 +
    8 * 60 * 60 * 1000
);

function RT(X, Y) {
    do rt = Math.floor(Math.random() * Y);
    while (rt < X)
    return rt;
}


//console.log('\n'+getCurrentDate());
function getCurrentDate() {
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
        + " " + date.getHours() + seperator2 + date.getMinutes()
        + seperator2 + date.getSeconds();
    return currentdate;


}












function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `\ud83d\udd14${this.name}, \u5f00\u59cb!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, h] = i.split("@"), a = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(a, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(h); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) })) } post(t, e = (() => { })) { if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.post(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { this.initGotEnv(t); const { url: s, ...i } = t; this.got.post(s, i).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) }) } } time(t) { let e = { "M+": (new Date).getMonth() + 1, "d+": (new Date).getDate(), "H+": (new Date).getHours(), "m+": (new Date).getMinutes(), "s+": (new Date).getSeconds(), "q+": Math.floor(((new Date).getMonth() + 3) / 3), S: (new Date).getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, ((new Date).getFullYear() + "").substr(4 - RegExp.$1.length))); for (let s in e) new RegExp("(" + s + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? e[s] : ("00" + e[s]).substr(("" + e[s]).length))); return t } msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl; return { "open-url": e, "media-url": s } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))); let h = ["", "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="]; h.push(e), s && h.push(s), i && h.push(i), console.log(h.join("\n")), this.logs = this.logs.concat(h) } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t.stack) : this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t) } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, e) }
