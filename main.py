from pathlib import Path
import requests
import yaml
import os
import urllib3
import json
import time
import sys
from hashlib import md5

urllib3.disable_warnings()

# 配置
defua = ''
defup = ''
amount = 0
remain = 10
password = ''
defut = ''
project_id = '17478'
api_id = '335429'
status = True

dLoginUrl = 'http://api.fghfdf.cn/api/logins'
dGetCardUrl = 'http://api.fghfdf.cn/api/get_mobile'
dGetMessageUrl = 'http://api.fghfdf.cn/api/get_message'
dFreeUrl = 'http://api.fghfdf.cn/api/free_mobile'

regUrl = 'https://m.ys7.com/passport/register.html'
capUrl = 'https://api.ys7.com/v3/users/checkcode/mt/unlogin/init'
regApiUrl = 'https://api.ys7.com/v3/users/regist/v2'


def init():
    print('程序启动')
    path = os.getcwd()
    settings = Path(path + '//settings.yml')
    print('查找配置文件')
    if not settings.is_file():
        print('配置文件不存在,新建配置文件')
        fp = open(settings, 'w', encoding='utf-8')
        fp.write('#德芙云配置\nDefu:\n  account: \n  password: \n\n#注册设置\nReg:\n  #注册数量\n  amount: 1\n  #t统一密码\n  password: qwer1234')
        fp.close()
        print(settings)
        print('创建成功，请填写详细配置')
        # os.system('pause')
        sys.exit(0)
    else:
        print('正在读取')
        fp = open(settings, 'r', encoding='utf-8')
        text = fp.read()
        set = yaml.full_load(text)
        for op in set.values():
            for key, v in op.items():
                if v is None:
                    print(key + '的值为空，请补充配置文件')
                    # os.system('pause')
                    sys.exit(0)
        global defua
        global defup
        global amount
        global password
        defua = set['Defu']['account']
        defup = set['Defu']['password']
        amount = set['Reg']['amount']
        password = md5(set['Reg']['password'].encode(encoding='UTF-8')).hexdigest()
    print('读取成功')


def main():
    global status
    req = requests.session()
    # headers = {
    #     'Upgrade-Insecure-Requests': '1',
    #     'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Mobile Safari/537.36',
    # }
    #
    # params = (
    #     ('come', 'dealer'),
    # )
    #
    # res = req.get(regUrl, headers=headers, params=params)
    # html = etree.HTML(res.text)
    # csrf = html.xpath('//meta[@name="csrf-token"]')
    # token = csrf[0].attrib['content']
    # print(token)
    featureCode = md5(str(time.time()).encode('utf-8')).hexdigest()

    # 获取手机号账号
    print('获取手机号')
    phoneNum = ''
    status = True
    while status:
        res = dGetCard()
        if res['message'] == 'ok':
            global remain
            phoneNum = res['mobile']
            # for key, v in res.items():
            #     print(key, v)
            remain = int(res['1分钟内剩余取卡数:'])
            status = False
            print('获取成功，手机号：' + phoneNum)
        else:
            print('获取失败，' + res['message'])
            print('程序中止')
            return {'success': False, 'continue': False}

    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'appId': 'ys7',
        'featureCode': featureCode,
        'Host': 'api.ys7.com',
        'clientVersion': '6.2.0.1300371',
        'sessionId': '',
        'clientType': '1',
        'clientNo': '',
        'netType': 'WIFI',
        'User-Agent': 'VideoGo/6.2.0 (iPhone; iOS 14.4.1; Scale/3.00)',
        'ssid': '',
        'osVersion': '14.4.1',
    }

    data = {
        'bizType': 'USER_REGISTRATION',
        'from': phoneNum,
        'msgType': '1'
    }

    res = req.post(capUrl, headers=headers, data=data, verify=False)
    res = json.loads(res.text)
    if res['meta']['code'] != 200:
        print(res['meta']['message'])
        return {'success': False, 'continue': True}
    # 获取验证码
    print('开始读取验证码')
    code = ''
    status = True
    attemps = 0
    while status:
        if attemps > 10:
            dFree(phoneNum)
            print('%s获取超时，已释放' % phoneNum)
            status = False
            return {'success': False, 'continue': True}
        res = dGetMessage(phoneNum)
        if res['message'] == '短信还未到达,请继续获取':
            print('短信还未到达, 请继续获取')
            attemps += 1
            time.sleep(5)
        elif res['message'] == 'ok':
            print(res['data'][0]['modle'])
            code = res['code']
            dFree(phoneNum)
            status = False
        else:
            dFree(phoneNum)
            print('错误：%s' % res['message'])
            status = False
            return {'success': False, 'continue': True}

    # 注册
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'appId': 'ys7',
        'featureCode': featureCode,
        'Host': 'api.ys7.com',
        'clientVersion': '6.2.0.1300371',
        'sessionId': '',
        'User-Agent': 'VideoGo/6.2.0 (iPhone; iOS 14.4.1; Scale/3.00)',
        'clientType': '1',
        'clientNo': '',
        'netType': 'WIFI',
        'Connection': 'keep-alive',
        'osVersion': '14.4.1',
        'ssid': '',
    }

    data = {
        'bizType': 'USER_REGISTRATION',
        'cuName': 'Q07igJhzIGlQaG9uZSAxMg==',
        'featureCode': featureCode,
        'password': password,
        'phone': phoneNum,
        'provider': 'aliyun',
        # 'pushRegisterJson': ' [{"channel":99},{"channel":5,"channelRegisterJson":"{\\"token\\":\\"c9882eba75d3e595b78f19adc9305751a4fa37a99da204d66126ed46cef0d9c7\\",\\"callTokenType\\":1}"}]',
        'smsCode': code,
        'smsToken': '',
        'username': ''
    }

    res = req.post(regApiUrl, headers=headers, data=data, verify=False)

    # res = req.post(regApiUrl, headers=headers, params=params, data=data)
    res = json.loads(res.text)
    if res['meta']['code'] == 200:
        return {'success': True, 'phoneNum': phoneNum, 'featureCode': featureCode}
    else:
        print(res['meta']['message'])
        return {'success': False, 'continue': True}


def dLogin():
    print('尝试登录德芙云')
    data = (
        ('username', defua),
        ('password', defup)
    )
    res = requests.get(url=dLoginUrl, params=data)
    res = json.loads(res.text)
    if res['message'] != '登录成功':
        print(res['message'])
        # os.system('pause')
        sys.exit(0)
    else:
        print('登录成功')
        data = res['data'][0]
        global defut
        defut = res['token']
        print('id：%s，余额：%s' % (data['id'], data['money']))


def dGetCard():
    data = (
        ('token', defut),
        ('project_id', project_id),
        ('operator', '5'),
        # ('api_id', api_id),
        ('loop', '1')
    )
    res = requests.get(url=dGetCardUrl, params=data)
    res = json.loads(res.text)
    return res


def dGetMessage(phoneNum):
    data = (
        ('token', defut),
        ('project_id', project_id),
        ('phone_num', phoneNum)
    )
    res = requests.get(url=dGetMessageUrl, params=data)
    res = json.loads(res.text)
    return res


def dFree(phoneNum):
    data = (
        ('token', defut),
        ('project_id', project_id),
        ('phone_num', phoneNum)
    )
    res = requests.get(url=dFreeUrl, params=data)
    res = json.loads(res.text)
    return res


def writeFile(text):
    dataFile.write(text)
    dataFile.flush()


# Press the green button in the gutter to run the script.
if __name__ == '__main__':
    init()
    dLogin()
    path = os.getcwd()
    data = Path(path + '/data.txt')
    dataFile = open(data, 'a')
    count = 0
    while count < amount:
        if remain < 10:
            print('一分钟内可取号小于10，暂停60s')
            time.sleep(60)
        print('开始注册第%d个账号' % (count+1))
        res = main()
        if res['success']:
            print('注册成功写入data.txt')
            writeFile('account=%s&featureCode=%s&password=%s@' % (res['phoneNum'], res['featureCode'], password))
            count += 1
        elif res['continue']:
            continue
        else:
            break
    dataFile.close()
    # os.system('pause')


# See PyCharm help at https://www.jetbrains.com/help/pycharm/
