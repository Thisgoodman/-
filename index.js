var http=require('http');
var url=require('url');
var fs=require('fs');
var querystring=require('querystring');
var cookie =require('cookie');
//引入数据库
//需要安装mysql的驱动，用npm，npm官网有使用说明
var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'ajax-practice'
});
connection.connect(function(err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }

    console.log('connected as id ' + connection.threadId);
});


var app=http.createServer(function (req,res) {
    //需求：当用户访问‘/’返回index.html；当访问“/login.html”返回login.html。
    var obj_url=url.parse(req.url);
    //加载主页面
    if(obj_url.pathname==='/'){
        render('./template/index.html',res);
        //直接返回，不会执行后面的代码
        return;
    }

    //处理注册功能
    if(obj_url.pathname==='/register' && req.method==='POST'){
        //接受前台发过来的数据，注册验证
        res.setHeader('content-type','text/html;charset=utf-8');
        var post_dat='';
        req.on('data',function (chunk) {
            post_dat+=chunk;
        });
        req.on('end',function () {
            var post_obj=querystring.parse(post_dat);
            //判断是否为空，密码是否一致
            if(post_obj.username==='' || post_obj.password===''){
                res.write('{"status":1,"message":"用户名和密码不能为空"}');
                res.end();
            }else if(post_obj.password !== post_obj.repassword){
                res.write('{"status":1,"message":"两次密码输入不一致"}')
                res.end();
            }
            //注册成功，并把信息写入到数据库
            else{
                var sql='INSERT INTO admin(username,password) VALUE("'+post_obj.username+'","'+post_obj.password+'")';
                connection.query(sql,function (error,result) {
                    //如果error不为空，result长度不为0且不为undefined，则返回注册成功的信息。
                    //Object.keys() 方法会返回一个由给定对象的所有可枚举自身属性的属性名组成的数组
                    var resultArr=Object.keys(result);
                    if(!error && result && resultArr.length!==0){
                        res.write('{"status":0,"message":"注册成功"}');
                        res.end();
                    }
                })
            }
        });
        return;
    }

    //处理登录功能
    if(obj_url.pathname==='/login' && req.method==='POST'){
        res.setHeader('content-type','text/html;charset=utf-8');
        var user_info='';
        req.on('data',function (funk) {
            user_info+=funk;
        });
        req.on('end',function () {
            var obj_info=querystring.parse(user_info);
            var sql="SELECT * FROM admin WHERE username='"+ obj_info.username +"' AND password='"+ obj_info.password +"'";
            connection.query(sql,function(error,result){
                if(!error && result &&result.length===1){
                    //设置cookie
                    res.setHeader('Set-Cookie',	cookie.serialize('isLogin',	"true"));
                    res.write('{"status":0,"message":"登录成功"}');
                    res.end();
                }else{
                    res.write('{"status":1,"message":"用户名或密码错误"}');
                    res.end();
                }
            })
        });
        return;
    }

    //返回数据表格，显示用户信息
    if(obj_url.pathname === '/user' && req.method=== 'GET'){
        res.setHeader('content-type','text/html;charset=utf-8');
        var sql="SELECT * FROM user";
        connection.query(sql,function (error,result) {
            if(!error && result){
                var result_json=JSON.stringify(result);
                res.write('{"status":0,"message":'+ result_json +'}','utf-8');
                res.end();
            }
        })
        return;
    }

    //添加用户信息
    if(obj_url.pathname ==='/adduser' && req.method === 'POST'){
        res.setHeader('content-type','text/html;charset=utf-8');
        var user_info='';
        req.on('data',function (chunk) {
            user_info+=chunk;
        });
        req.on('end',function (err) {
            if(!err){
                //将接收到的字符串转换为对象
                var user_obj=querystring.parse(user_info);
                //将接收到的数据添加到数据库中
                var sql="INSERT INTO user VALUES("+ null +",'"+ user_obj.username +"','"+ user_obj.email
                    +"','"+ user_obj.phone +"','"+ user_obj.qq +"')";
                connection.query(sql,function (error,result) {
                    if(!error && result && result.length!==0){
                        res.write('{"status":0,"message":"添加成功"}');
                        res.end();
                    }else{
                        res.write('{"status":1,"message":"添加失败"}');
                        res.end();
                    }
                })
            }
        });
        return;
    }

    //编辑用户信息
    if(obj_url.pathname ==='/edituser' && req.method === 'POST'){
        res.setHeader('content-type','text/html;charset=utf-8');
        var user_info='';
        req.on('data',function(chunk){
            user_info+=chunk;
        });
        req.on('end',function (err) {
            if(!err){
                //将查询字符串转换为对象
                var  user_obj=querystring.parse(user_info);
                //更新数据库中的信息
                var sql="UPDATE user SET username='"+ user_obj.username +"',email='"+ user_obj.email
                    + "',phone='"+ user_obj.phone + "',qq='" + user_obj.qq +"' WHERE id="+user_obj.id;
                connection.query(sql,function (error,result) {
                    if (!error && result && result.length!==0){
                        res.write('{"status":0,"message":"修改成功"}');
                        res.end();
                    }else{
                        res.write('{"status":1,"message":"修改失败"}');
                        res.end();
                    }
                })
            }
        });
        return;
    }

    //删除用户信息
    if(obj_url.pathname ==='/delete' && req.method === 'POST'){
        res.setHeader('content-type','text/html;charset=utf-8');
        var user_info='';
        req.on('data',function(chunk){
            user_info+=chunk;
        });
        req.on('end',function (err) {
            if(!err){
                //将查询字符串转换为对象
                var  user_obj=querystring.parse(user_info);
                //更新数据库中的信息
                var sql="DELETE FROM user WHERE id="+user_obj.id;
                connection.query(sql,function (error,result) {
                    if (!error && result && result.length!==0){
                        res.write('{"status":0,"message":"删除成功"}');
                        res.end();
                    }else{
                        res.write('{"status":1,"message":"删除失败"}');
                        res.end();
                    }
                })
            }
        });
        return;
    }

    //加载admin页面时，判断cookie
    if(obj_url.pathname ==='/admin.html' && req.method==='GET'){
        var cookie_obj=cookie.parse(req.headers.cookie || "");
        if (cookie_obj.isLogin ==='true'){
            render('./template/admin.html',res);
        }else{
            render('./template/login.html',res);
        }
        return;
    }

    //退出系统
    if(obj_url.pathname ==='/logout' && req.method === 'GET'){
        res.setHeader('Set-Cookie',	cookie.serialize('isLogin',	""));
        render('./template/login.html',res);
        return;
    }

    //加载各种文件
    render('./template'+obj_url.pathname,res);
});


app.listen(3000,function (err) {
    if(!err){
        console.log('listening');
    }
});


/**
 * 读取特定路径下的html页面
 * @param path  html文件的路径
 * @param res   服务器响应
 */
function render(path,res) {
    //binary：以二进制形式读取文件
    fs.readFile(path,'binary',function (err,data) {
        if(!err){
            //以二进制形式响应
            res.write(data,'binary');
            res.end();
        }
    })
}