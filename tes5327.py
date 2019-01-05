#coding=UTF-8

"""
TCP Client sample
"""
import random
import codecs
import datetime
import socket
from time import sleep
SERIAL = 15
BASE = int('63', 16) + SERIAL
DEVICE = int('A0', 16) + SERIAL

target_host = "45.32.169.170"
# target_host = "localhost"
target_port = 5327

# create socket
# AF_INET 代表使用標準 IPv4 位址或主機名稱
# SOCK_STREAM 代表這會是一個 TCP clie   nt
client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# client 建立連線
client.connect((target_host, target_port))

# 傳送資料給 target
# 01010013FFFFFFFFFF00532803081030ca2c57ff27530072
# 01010013c893467543f8532803081030ca2c67ff275200c8
# 5326: 0101000fFFFFFFFFFF00532601c004403da4a897
# 5326: 0101000fc893467555cd532601c004403da4a897

while 1:
    client2 = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    client2.connect((target_host, target_port))
    client2.send("01010013FFFFFFFFFF00532704091030ca2c57ff2753FF72".decode("hex"))
    response = client2.recv(4096)
    print(response)
    client2.close()
    sleep(10)


'''
i = 0
while 1:
    # i = (i + 1) % 50
    i = random.randint(6,30)
    TMP = format(i, '04x')
    A = TMP[0:2]
    B = TMP[-2:]
    R = check(A, B)
    DATA = [int('55', 16), int('AA', 16), int('11', 16),
        int('01', 16), int('23', 16), int('45', 16), int('67', 16), int('89', 16), DEVICE,
        int(A, 16), int(B, 16),
        int('00', 16), int('00', 16), int('01', 16), int('31', 16), int('03', 16), int('25', 16), int('00', 16),
        R, int('ED', 16), ]
    OUT = ''.join('%02x'%i for i in DATA)

    sleep(1)    #in seconds
    TIME_REQ = str(datetime.datetime.now())
    client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    client.connect((target_host, target_port))
    # client.send("55AA11AB9876543210EA5F0000013103250049ED".decode("hex")) # EA5F 59999
    client.send(codecs.decode(OUT, 'hex')) # EA5F 59999

    # client.send("55AA11AB9876543210EA600000013103250048ED".decode("hex")) # EA60 60000
    #client.send("55AA110123456789ABEA600000013103250048ED".decode("hex")) # EA60 60000
    #client.send("55AA110123456789ABEA600000013103250048ED".decode("hex")) # EA60 60000
    #client.send("55AA110123456789ABEA600000013103250048ED".decode("hex")) # EA60 60000
    # client.send("55AA110123456789ABEA600000013103250048ED".decode("hex")) # EA60 60000
    # client.send("55AA110123456789ABEA600000013103250048ED".decode("hex")) # EA60 60000
    # client.send("55AA110123456789AB03E800000131032500C0ED".decode("hex")) # 03E8 100
    # 接收資料
    
    # TIME_RES = str(datetime.datetime.now())
    # print(str(TIME_REQ) + ' ~ ' + str(TIME_RES) + ':\t D='+ '{0:0{1}X}'.format(DEVICE,2) + '\tPM25=' + str(i) + '\t SERVER=' + str(response))
    # print("GO: ", i)
    # 印出資料信息
    response = client.recv(4096)
    print response
    client.close()
'''

def check(_a, _b):
    S = (int(_a, 16) + int(_b, 16)) % 256
    R = 256 - ( (BASE + S) % 256 ) # int('9D', 16)
    # print('R: ', '{0:0{1}X}'.format(R,4))
    return R%256