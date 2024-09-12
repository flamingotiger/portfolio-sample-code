import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:united_timer/src/controllers/MainController.dart';
import 'package:united_timer/src/models/timezone.model.dart';
import 'package:united_timer/src/utils/CustomColors.dart';
import 'package:united_timer/src/utils/PlatformLayout.dart';
import 'package:united_timer/src/views/Nation/widgets/NationList.dart';
import 'package:united_timer/src/views/Nation/widgets/NationTextField.dart';
import 'package:united_timer/src/widgets/AdBanner.dart';
import 'package:united_timer/src/widgets/Header.dart';

class NationBinding extends Bindings {
  @override
  void dependencies() {
    Get.put<NationController>(NationController(), permanent: true);
  }
}

class NationController extends GetxController {
  final MainController controller = Get.find<MainController>();
  final TextEditingController nationTextFieldController =
      TextEditingController();
  RxString searchText = ''.obs;
  FocusNode nationTextFieldFocusNode = FocusNode();

  final RxList<TimezoneModel> timezones = <TimezoneModel>[].obs;

  void onNationChanged() {
    searchText.value = nationTextFieldController.text.toLowerCase().trim();
    final items = controller.timezones
        .where((element) => element.name.toLowerCase().contains(searchText))
        .toList();

    items.sort((prev, next) {
      String prevLower = prev.name.toLowerCase();
      String nextLower = next.name.toLowerCase();

      if (searchText.isNotEmpty) {
        bool prevStartsWith = prevLower.startsWith(searchText);
        bool nextStartsWith = nextLower.startsWith(searchText);

        // 첫 글자가 searchText의 첫 글자와 일치하는 경우 우선 정렬
        if (prevLower.startsWith(searchText.value[0]) &&
            !nextLower.startsWith(searchText.value[0])) {
          return -1;
        }
        if (!prevLower.startsWith(searchText.value[0]) &&
            nextLower.startsWith(searchText.value[0])) {
          return 1;
        }

        // 그 다음으로 searchText로 시작하는 경우 우선 정렬
        if (prevStartsWith && !nextStartsWith) {
          return -1;
        }
        if (!prevStartsWith && nextStartsWith) {
          return 1;
        }
        return prevLower.compareTo(nextLower);
      }
      // 그 외의 경우, 알파벳 순으로 정렬
      return prevLower.compareTo(nextLower);
    });

    if (items.isEmpty) {
      timezones.value = [];
      return;
    }
    timezones.value = items;
  }

  @override
  void onInit() {
    super.onInit();
    // 처음 화면에 들어왔을때 world에서 nation으로 선택했을때
    final String name = Get.arguments ?? '';
    if (name.isNotEmpty) {
      nationTextFieldController.text = name;
      searchText.value = name;
    }
    onNationChanged();
    nationTextFieldFocusNode.addListener(() {
      if (nationTextFieldFocusNode.hasFocus) {
        nationTextFieldController.selection = TextSelection(
          baseOffset: 0,
          extentOffset: nationTextFieldController.value.text.length,
        );
      }
    });
  }

  @override
  void onClose() {
    nationTextFieldController.dispose();
    nationTextFieldFocusNode.dispose();
    super.onClose();
  }
}

class NationView extends GetView<NationController> {
  const NationView({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final orientation = MediaQuery.of(context).orientation;
    final availableWidth = MediaQuery.of(context).size.width -
        MediaQuery.of(context).padding.left -
        MediaQuery.of(context).padding.right;
    final availableHeight = MediaQuery.of(context).size.height -
        MediaQuery.of(context).padding.top -
        MediaQuery.of(context).padding.bottom;
    return Scaffold(
        backgroundColor: CustomColors.bg,
        body: SafeArea(
            child: SingleChildScrollView(
                child: Container(
                    width: availableWidth,
                    height: availableHeight,
                    padding: PlatformLayout.squareBackgroundPadding(),
                    child: orientation == Orientation.portrait
                        ? const PortraitWidget()
                        : const LandscapeWidget()))));
  }
}

class PortraitWidget extends GetView<NationController> {
  const PortraitWidget({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: Container(
              decoration: const BoxDecoration(
                  borderRadius: BorderRadius.all(Radius.circular(20)),
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      CustomColors.linearTop,
                      CustomColors.linearMiddle,
                      CustomColors.linearBottom
                    ],
                  )),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Header(
                    isWorld: true,
                  ),
                  Expanded(
                      child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                        NationTextField(),
                        const SizedBox(
                          height: 20,
                        ),
                        NationList(),
                      ])),
                  const AdBannerWidget(),
                ],
              )),
        ),
      ],
    );
  }
}

class LandscapeWidget extends GetView<NationController> {
  const LandscapeWidget({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
        decoration: const BoxDecoration(
            borderRadius: BorderRadius.all(Radius.circular(20)),
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                CustomColors.linearTop,
                CustomColors.linearMiddle,
                CustomColors.linearBottom
              ],
            )),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Expanded(
              child: Column(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    NationTextField(),
                    const SizedBox(
                      height: 20,
                    ),
                    NationList(),
                  ]),
            ),
            Header(
              isWorld: true,
              isLandscape: true,
            ),
          ],
        ));
  }
}
