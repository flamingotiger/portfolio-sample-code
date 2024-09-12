import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:oranpick/models/geolocator_model.dart';
import 'package:oranpick/models/place.dart';
import 'package:oranpick/models/place_model.dart';
import 'package:oranpick/models/setting_model.dart';
import 'package:oranpick/routes/SearchMoreScreen.dart';
import 'package:provider/provider.dart';
import 'package:webview_flutter/webview_flutter.dart';

List<Place> parsePlaces(String responseBody) {
  final parsed = json.decode(responseBody).cast<Map<String, dynamic>>();

  return parsed.map<Place>((json) => Place.fromJson(json)).toList();
}

class SearchScreen extends StatefulWidget {
  SearchScreen({Key key}) : super(key: key);

  @override
  _SearchScreenState createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  WebViewController _webViewController;

  final GlobalKey<ScaffoldState> _scaffoldKey = new GlobalKey<ScaffoldState>();
  @override
  void initState() {
    super.initState();
    // Enable hybrid composition.
    if (Platform.isAndroid) WebView.platform = SurfaceAndroidWebView();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        key: _scaffoldKey,
        body: SafeArea(
            child: Container(
                color: Colors.white,
                child: WebView(
                  initialUrl:
                      'https://flamingotiger.github.io/oranpick-webview/',
                  javascriptMode: JavascriptMode.unrestricted,
                  onWebViewCreated: (WebViewController webViewController) {
                    _webViewController = webViewController;
                  },
                  onPageFinished: (finish) {
                    Position position =
                        Provider.of<GeolocatorModel>(context, listen: false)
                            .position;
                    _webViewController.evaluateJavascript(
                        'window.getPositionAppToWeb(${position.latitude},${position.longitude})');

                    String placeCode =
                        Provider.of<SettingModel>(context, listen: false)
                            .placeCode;
                    _webViewController
                        .evaluateJavascript('window.setSetting("$placeCode")');
                  },
                  javascriptChannels: Set.from([
                    JavascriptChannel(
                        name: "getPlacesWebToApp",
                        onMessageReceived: (JavascriptMessage result) {
                          // json convert reference https://bezkoder.com/dart-flutter-parse-json-string-array-to-object-list/
                          var data = result.message;
                          var dataJson = jsonDecode(data)['places'] as List;
                          List<Place> places = dataJson
                              .map((placeJson) => Place.fromJson(placeJson))
                              .toList();
                          Provider.of<PlaceModel>(context, listen: false)
                              .addPlaces(places);
                          Navigator.of(context).push(MaterialPageRoute(
                            builder: (context) => SearchMoreScreen(),
                          ));
                        })
                  ]),
                ))));
  }
}
