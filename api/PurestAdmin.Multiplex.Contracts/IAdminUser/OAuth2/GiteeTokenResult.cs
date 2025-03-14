﻿// Copyright © 2023-present https://github.com/dymproject/purest-admin作者以及贡献者

using System.Text.Json.Serialization;

namespace PurestAdmin.Multiplex.Contracts.IAdminUser.OAuth2;
public class GiteeTokenResult
{
    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; }

    [JsonPropertyName("token_type")]
    public string TokenType { get; set; }

    [JsonPropertyName("expires_in")]
    public int ExpiresIn { get; set; }

    [JsonPropertyName("refresh_token")]
    public string RefreshToken { get; set; }

    [JsonPropertyName("scope")]
    public string Scope { get; set; }

    [JsonPropertyName("created_at")]
    public int CreatedAt { get; set; }
}
