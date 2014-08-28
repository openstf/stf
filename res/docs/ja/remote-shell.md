# リモート・シェル参照

### ファイル一覧
```
ls -la
```
シェル起動直後はディレクトリはルートです。


### パッケージ名列挙

```
pm list packages
```
インストールされてるアプリのパッケージ名が列挙される。

パッケージ名を一部しか覚えていないときに `pm list packages [パッケージ名]` のようにフィルタリングすることができる。


### パッケージ削除

```
pm uninstall [パッケージ名]
```

その他のパッケージ・マネジャーのコマンドは [ADB pm | Android Developers](http://developer.android.com/tools/help/adb.html#pm) を参照。


### ファイルの中身

```
cat /sdcard/hoge.txt
```

読み込み権限のあるファイルの中身を簡単に確認するときに使う。


### アプリの起動

**Activityの起動 (ACTION_VIEW + URL)**

```
am start -a android.intent.action.VIEW -d http://google.com
```

**Activityの起動(クラス名を指定)**

```
am start -n com.hoge.app/.FugaActivity
```

**サービスの起動**

```
am startservice ... # Intentの指定方法はActivityと同じ
```

**ブロードキャストの送信**

```
am broadcast ... # Intentの指定方法はActivityと同じ
```


### キーイベント送信

```
input keyevent 3 # HOMEキー
```

数値でキーコードを指定する。

キーコードは[KeyEvent | Android Developers](http://developer.android.com/reference/android/view/KeyEvent.html)を参照。

### 画面録画 (KitKat4.4より)

最大３分操作情報を録画できる。

```
pre screenrecord [options] <filename>
```

[options]は[ADB screenrecord | Android Developers](http://developer.android.com/tools/help/adb.html#screenrecord)を参照。

`filename`には端末側のパスを指定する。

```
screenrecord /sdcard/movie/sample.mp4
```

### メモリ専有状況

```
dumpsys procstats [パッケージ名]
```

例： `dumpsys procstats com.android.chrome`

---


### その他のシェルコマンド
実行可能なシェルコマンドの一覧を取得するのに、下記のコマンドを実行する。

```
ls /system/bin
```


もっと詳しいリファレンスは[こちら](https://github.com/jackpal/Android-Terminal-Emulator/wiki/Android-Shell-Command-Reference)。
