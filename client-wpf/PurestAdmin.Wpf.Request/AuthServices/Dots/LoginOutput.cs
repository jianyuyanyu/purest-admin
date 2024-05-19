﻿// Copyright © 2023-present https://github.com/dymproject/purest-admin作者以及贡献者

namespace PurestAdmin.Wpf.Request.AuthServices.Dots;
/// <summary>
/// 登录模型
/// </summary>
public class LoginOutput
{
    /// <summary>
    /// 用户Id
    /// </summary>
    public long Id { get; set; }

    /// <summary>
    /// 姓名
    /// </summary>
    public string Name { get; set; }

    /// <summary>
    /// 权限集合
    /// </summary>
    public List<string> Permissions { get; set; }

}