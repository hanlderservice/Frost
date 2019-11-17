define([
    'text!modules/common/monitor/sysmonitor/templates/sysAlarmMap.html',
    'i18n!modules/common/monitor/sysmonitor/i18n/SysMonitor.i18n',
    'modules/common/cloud-utils',
    'echarts'
], function (viewTpl, i18n, utils, echarts) {

    return fish.View.extend({
        template: fish.compile(viewTpl),
        i18nData: fish.extend({}, i18n),
        toolTipData:{},  //存储悬浮窗信息
        isReqPoolList:false,   //方法 findPoolListByCond 真正请求中

        initialize: function () {
            this.$el.css({
                "height": "100%",
                "width": "100%"
            });
        },

        resize: function () {
            if (this.myChart) {
                this.myChart.resize();
            }
        },

        //这里用来进行dom操作
        _render: function () {
            this.$el.html(this.template(this.i18nData));

            return this;
        },

        //这里用来初始化页面上要用到的fish组件
        _afterRender: function () {
            var me = this;

            me.$('#sysAlarmMapChart').blockUI({message:''});

            utils.ajax('spaceResourceService', 'findAllDcProvinceList').done(function (res) {
                me.$('#sysAlarmMapChart').unblockUI({message:''});
                me.initEcharts(res);
            })
        },

        initEcharts: function (res) {
            var systemMonitorTestMode = false;   //是否为测试模式
            var staffIdParam = utils.getHash().get('staffId');
            if (staffIdParam) {
                var ifPair = staffIdParam.type == "pair" && staffIdParam.value == session.currentUser.staffId;
                var ifList = staffIdParam.type == "list" && _.find(staffIdParam.value, function (i) {
                    return i == session.currentUser.staffId
                });
                if (ifPair || ifList) systemMonitorTestMode = true;
            }

            var me = this;
            var myChart = echarts.init(document.getElementById('sysAlarmMapChart'));
            this.myChart = myChart;

            var jointly_operate = [];  //只有合营池
            var self_operate = [];  //只有自研池
            var both = [];  //有自研池和合营池两类
            var special = [];  //特殊情况，目前有贵州和内蒙古

            var push = function (target,value,size) {
                target.push({
                    name: value.areaName,
                    areaId: value.areaId,
                    value: [value.longitude, value.latitude, size]
                })
            }

            var handle = function (v) {
                if(v.poolType){
                    switch (v.poolType) {
                        case 'JOINTLY_OPERATE':
                            push(jointly_operate,v,80);
                            break;
                        case 'SELF_OPERATE':
                            push(self_operate,v,80);
                            break;
                        case 'BOTH':
                            push(both,v,80);
                            break;
                        case 'SPECIAL':
                            push(special,v,100);
                            break;
                        default:
                            console.log('没有匹配的资源池');
                    }
                }
            }

            res.forEach(handle);

            if(systemMonitorTestMode){
                me.provinceListMock.forEach(handle)
            }

            var option = {
                backgroundColor: 'rgb(50,56,66)',
                title: {
                    text: '2+31+X资源布局',
                    left: 'left',
                    textStyle: {
                        color: '#f6f6f6',
                        fontSize: 18,
                        fontWeight: 'normal',
                        fontFamily: 'Microsoft YaHei'
                    },
                    padding: [3, 0, 0, 15]
                },
                tooltip: {
                    trigger: 'item',
                    formatter: function (params, ticket, callback) {
                        return me.formatData(params, ticket, callback)
                    }
                },
                legend: {
                    orient : 'vertical',
                    x: 'left',
                    y:'bottom',
                    data:['合营池与自研池共有的省份','只有自研池的省份','只有合营池的省份','内蒙和贵州2个园区'],
                    textStyle : {
                        color:'#fff',
                        fontSize:10
                    }
                },
                geo: {
                    zoom: 1.2,
                    show: true,
                    map: 'china',
                    label: {
                        normal: {
                            show: false
                        },
                        emphasis: {
                            show: false,
                        }
                    },
                    roam: true,
                    itemStyle: {
                        normal: {
                            areaColor: 'rgb(50,56,66)',
                            borderColor: 'rgb(11,121,204)',
                            borderWidth: 2
                        },
                        emphasis: {
                            areaColor: 'rgb(50,56,66)',
                        }
                    }
                },
                series: [
                    {
                        name:'只有合营池的省份',
                        type: 'effectScatter',
                        coordinateSystem: 'geo',
                        data: jointly_operate,
                        symbolSize: function (val) {
                            return val[2] / 10;
                        },
                        label: {
                            normal: {
                                formatter: '{b}',
                                position: 'right',
                                fontSize: 10,
                                show: true
                            },
                            emphasis: {
                                show: true
                            }
                        },
                        rippleEffect: {
                            brushType: 'stroke',
                            scale: 2.5
                        },
                        itemStyle: {
                            normal: {
                                color: '#53f078',
                                shadowColor: '#53f078',
                                shadowBlur: 10
                            }
                        }
                    },
                    {
                        name:'只有自研池的省份',
                        type: 'effectScatter',
                        coordinateSystem: 'geo',
                        data: self_operate,
                        symbolSize: function (val) {
                            return val[2] / 10;
                        },
                        label: {
                            normal: {
                                formatter: '{b}',
                                position: 'right',
                                fontSize: 10,
                                show: true
                            },
                            emphasis: {
                                show: true
                            }
                        },
                        rippleEffect: {
                            brushType: 'stroke',
                            scale: 2.5
                        },
                        itemStyle: {
                            normal: {
                                color: 'rgb(5,252,230)',
                                shadowColor: 'rgb(5,252,230)',
                                shadowBlur: 10
                            }
                        }
                    },
                    {
                        name:'合营池与自研池共有的省份',
                        type: 'effectScatter',
                        coordinateSystem: 'geo',
                        data: both,
                        symbolSize: function (val) {
                            return val[2] / 10;
                        },
                        label: {
                            normal: {
                                formatter: '{b}',
                                position: 'right',
                                fontSize: 10,
                                show: true
                            },
                            emphasis: {
                                show: true
                            }
                        },
                        rippleEffect: {
                            brushType: 'stroke',
                            scale: 2.5
                        },
                        itemStyle: {
                            normal: {
                                color: '#ffff00',
                                shadowColor: '#ffff00',
                                shadowBlur: 10
                            }
                        }
                    },
                    {
                        name:'内蒙和贵州2个园区',
                        type: 'effectScatter',
                        coordinateSystem: 'geo',
                        data: special,
                        symbolSize: function(val) {
                            return val[2] / 10;
                        },
                        label: {
                            normal: {
                                formatter: '{b}',
                                position: 'right',
                                fontSize:10,
                                show: true
                            },
                            emphasis: {
                                show: true
                            }
                        },
                        itemStyle: {
                            normal: {
                                color: '#ffa022',
                                shadowBlur: 10,
                                shadowColor: '#ffa022'
                            }
                        },
                        rippleEffect: {
                            brushType: 'stroke',
                            scale:2.5
                        },
                        zlevel: 2
                    }
                ]
            };
            myChart.setOption(option);
        },

        formatData : function (params, ticket, callback) {
            var me = this;
            var hasData = Object.keys(this.toolTipData).indexOf(params.data.name) !== -1;
            if(hasData){
                var tableData = this.toolTipData[params.data.name];
                var html = this.data2Html(tableData);
                return html;
            }else {
                var cb = function(data){
                    var html = me.data2Html(data);
                    callback(ticket, html);
                }
                if(!me.isReqPoolList){
                    this.getTipData(params, cb);
                }
                return '加载中...';
            }
        },

        getTipData : function (params, cb) {
            var me = this;
            this.isReqPoolList = true;

            utils.ajax('virResService', 'findPoolListByCond',
                {areaId: params.data.areaId, name_cond: 'LIKE', vcenterIp_cond: "LIKE"}, 1, -1
            ).done(function (res) {
                me.isReqPoolList = false;
                var tableData = [];
                if(res.rows && res.rows.length !== 0){
                    var thead = [params.data.name,'总存储','已分配存储','已使用存储','宿主机(总)','物理CPU(总)','总内存'];
                    tableData.push(thead);
                    res.rows.forEach(function (v) {
                        tableData.push([
                            v.name,
                            v.allocatedSpace,
                            v.availableSpace,
                            v.allUsedSpace,
                            v.allServCount,
                            v.allCpuKernel,
                            v.allMemoryCapacity
                        ])
                    });
                    me.toolTipData[params.data.name] = tableData;
                    cb(tableData);
                }else {
                    cb([['暂无数据']]);
                }
            })
        },

        data2Html : function (data) {
            var style = 'style="padding:0 4px;"';
            var toolTiphtml = '<table>';
            data.forEach(function (v) {
                toolTiphtml += '<tr>';
                v.forEach(function (i) {
                    toolTiphtml += '<td ' + style + '>' + (i ? i : '') + '</td>'
                })
                toolTiphtml += '</tr>'
            })
            toolTiphtml += '</table>'

            return toolTiphtml;
        },

        provinceListMock:[
            {"areaId":50640,"areaName":"甘肃","parentId":50135,"grade":"C2","code":"6","longitude":"103.823555","latitude":"36.058041","provinceCode":"GS","itmsAreaCode":"8360000","parentItmsAreaCode":"8100000","poolType":"SELF_OPERATE"},
            {"areaId":50649,"areaName":"吉林","parentId":50135,"grade":"C2","code":"15","longitude":"125.324501","latitude":"43.886841","provinceCode":"JL","itmsAreaCode":"8360000","parentItmsAreaCode":"8100000","poolType":"SELF_OPERATE"},
            {"areaId":50653,"areaName":"宁夏","parentId":50135,"grade":"C2","code":"19","longitude":"106.278175","latitude":"38.466370","provinceCode":"NX","itmsAreaCode":"8360000","parentItmsAreaCode":"8100000","poolType":"SELF_OPERATE"},
            {"areaId":50654,"areaName":"青海","parentId":50135,"grade":"C2","code":"20","longitude":"101.778915","latitude":"36.623177","provinceCode":"QH","itmsAreaCode":"8360000","parentItmsAreaCode":"8100000","poolType":"SELF_OPERATE"},
            {"areaId":50656,"areaName":"山西","parentId":50135,"grade":"C2","code":"22","longitude":"112.549248","latitude":"37.857014","provinceCode":"SX","itmsAreaCode":"8360000","parentItmsAreaCode":"8100000","poolType":"SELF_OPERATE"},
            {"areaId":50660,"areaName":"天津","parentId":50135,"grade":"C2","code":"26","longitude":"117.190186","latitude":"39.125595","provinceCode":"TJ","itmsAreaCode":"8360000","parentItmsAreaCode":"8100000","poolType":"SELF_OPERATE"},
            {"areaId":50661,"areaName":"西藏","parentId":50135,"grade":"C2","code":"27","longitude":"91.132210","latitude":"29.660360","provinceCode":"XZ","itmsAreaCode":"8360000","parentItmsAreaCode":"8100000","poolType":"SELF_OPERATE"},
            {"areaId":50665,"areaName":"重庆","parentId":50135,"grade":"C2","code":"31","longitude":"106.504959","latitude":"29.533155","provinceCode":"CQ","itmsAreaCode":"8360000","parentItmsAreaCode":"8100000","poolType":"SELF_OPERATE"},
            {"areaId":50666,"areaName":"黑龙江","parentId":50135,"grade":"C2","code":"32","longitude":"126.642464","latitude":"45.756966","provinceCode":"CQ","itmsAreaCode":"8360000","parentItmsAreaCode":"8100000","poolType":"SELF_OPERATE"}
        ]

    });
});