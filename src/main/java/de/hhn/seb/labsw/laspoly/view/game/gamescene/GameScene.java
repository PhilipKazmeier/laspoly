/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.animation.Animation
 *  javafx.animation.FadeTransition
 *  javafx.animation.Interpolator
 *  javafx.animation.ParallelTransition
 *  javafx.animation.ScaleTransition
 *  javafx.animation.Transition
 *  javafx.animation.TranslateTransition
 *  javafx.beans.value.ObservableValue
 *  javafx.collections.FXCollections
 *  javafx.collections.ObservableList
 *  javafx.scene.AmbientLight
 *  javafx.scene.Camera
 *  javafx.scene.Cursor
 *  javafx.scene.DepthTest
 *  javafx.scene.Group
 *  javafx.scene.Node
 *  javafx.scene.Parent
 *  javafx.scene.PerspectiveCamera
 *  javafx.scene.PointLight
 *  javafx.scene.SceneAntialiasing
 *  javafx.scene.SubScene
 *  javafx.scene.control.Button
 *  javafx.scene.control.ComboBox
 *  javafx.scene.control.Label
 *  javafx.scene.control.ListView
 *  javafx.scene.control.ProgressIndicator
 *  javafx.scene.image.ImageView
 *  javafx.scene.input.KeyCode
 *  javafx.scene.input.MouseEvent
 *  javafx.scene.layout.AnchorPane
 *  javafx.scene.layout.Pane
 *  javafx.scene.layout.Region
 *  javafx.scene.layout.StackPane
 *  javafx.scene.paint.Color
 *  javafx.scene.paint.Material
 *  javafx.scene.paint.Paint
 *  javafx.scene.paint.PhongMaterial
 *  javafx.scene.shape.Box
 *  javafx.scene.transform.Rotate
 *  javafx.util.Duration
 */
package de.hhn.seb.labsw.laspoly.view.game.gamescene;

import de.hhn.seb.labsw.laspoly.model.Player;
import de.hhn.seb.labsw.laspoly.model.action.SwapOfferAction;
import de.hhn.seb.labsw.laspoly.model.card.action.ActionCard;
import de.hhn.seb.labsw.laspoly.model.card.action.ActionCardDeck;
import de.hhn.seb.labsw.laspoly.model.field.Field;
import de.hhn.seb.labsw.laspoly.model.field.FieldConfiguration;
import de.hhn.seb.labsw.laspoly.model.field.Property;
import de.hhn.seb.labsw.laspoly.model.field.TrainStation;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.model.settings.KeySettings;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.Final;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.ThreadRunner;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameSceneModelSource;
import de.hhn.seb.labsw.laspoly.utils.dataloading.ResourceBundleSource;
import de.hhn.seb.labsw.laspoly.view.game.GameController;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.CameraPolicy;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.NewSwapOfferController;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.Perspective;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.PerspectiveCameraManager;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.PreviewManager;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.PropertyCardCellRenderer;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.SwapOfferDialog;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.parts.Board;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.parts.CapitalChipView;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.parts.Dice;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.parts.DiceCup;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.parts.Indicator;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.parts.PlayerIndicator;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.parts.PropertyCardDeck;
import java.awt.MouseInfo;
import java.awt.Point;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.ResourceBundle;
import java.util.logging.Logger;
import java.util.stream.Stream;
import javafx.animation.Animation;
import javafx.animation.FadeTransition;
import javafx.animation.Interpolator;
import javafx.animation.ParallelTransition;
import javafx.animation.ScaleTransition;
import javafx.animation.Transition;
import javafx.animation.TranslateTransition;
import javafx.beans.value.ObservableValue;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.scene.AmbientLight;
import javafx.scene.Camera;
import javafx.scene.Cursor;
import javafx.scene.DepthTest;
import javafx.scene.Group;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.PerspectiveCamera;
import javafx.scene.PointLight;
import javafx.scene.SceneAntialiasing;
import javafx.scene.SubScene;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Label;
import javafx.scene.control.ListView;
import javafx.scene.control.ProgressIndicator;
import javafx.scene.image.ImageView;
import javafx.scene.input.KeyCode;
import javafx.scene.input.MouseEvent;
import javafx.scene.input.MouseEvent;
import javafx.scene.layout.AnchorPane;
import javafx.scene.layout.Pane;
import javafx.scene.layout.Region;
import javafx.scene.layout.StackPane;
import javafx.scene.paint.Color;
import javafx.scene.paint.Material;
import javafx.scene.paint.Paint;
import javafx.scene.paint.PhongMaterial;
import javafx.scene.shape.Box;
import javafx.scene.transform.Rotate;
import javafx.util.Duration;
import org.controlsfx.control.PopOver;

public class GameScene
extends SubScene {
    private static ResourceBundle resources;
    private final Group rootGroup;
    private final DiceCup diceCup;
    private final PerspectiveCamera camera = new PerspectiveCamera(true);
    private final Board board;
    private final PerspectiveCameraManager perspectiveManager;
    private final CapitalChipView capitalChipView;
    private Pane darkenPane;
    private Group capitalGroup;
    private EnhancedGroup curActionCardNode;
    private Logger logger;
    private PropertyCardDeck[] propertyCardDecks;
    private EnhancedGroup textGroup;
    private EnhancedGroup world;
    private Dice diceOne;
    private Dice diceTwo;
    private Indicator indicator;
    private PlayerIndicator playerIndicator;
    private GameController gameController;
    private PopOver previewPopOver;
    private Point lastPopOverMouseLocation;
    private Pane gameScenePane;
    private ActionCard curActionCard;
    private HashMap<Player, Perspective> playerPropertyPerspectiveMap;
    private AnchorPane listOfPropsPane;
    private StackPane initStackPane;

    public GameScene(Group root, ResourceBundle resourceBundle, HashMap<Player, Figure> playerFigureMap, GameController controller) {
        super((Parent)root, 850.0, 500.0, true, SceneAntialiasing.BALANCED);
        resources = resourceBundle;
        this.rootGroup = root;
        this.logger = LoggerFactory.initializeLogger((this).getClass(), "de/hhn/seb/labsw/laspoly/view/game/gamescene/gamescene_logging.properties");
        PreviewManager.addPreviewListener(this::showPreview);
        this.gameController = controller;
        this.board = new Board(playerFigureMap, resourceBundle.getLocale(), controller);
        this.diceCup = new DiceCup(controller, this);
        this.board.getCardDeck().setOnClickListener(() -> {
            if (this.curActionCardNode != null) {
                this.indicator.hide();
                this.showActionCard();
            }
        });
        this.initPropertyCardDecks(controller);
        this.capitalChipView = new CapitalChipView(controller.getClientPlayer());
        this.assignVariables();
        root.getChildren().add(this.world);
        root.setDepthTest(DepthTest.ENABLE);
        this.world.getChildren().add(this.textGroup);
        this.setFill((Paint)Color.WHITESMOKE);
        this.setCamera((Camera)this.camera);
        this.perspectiveManager = this.buildPerspectiveCamera();
        this.initMouseHandlers();
        Group playerGroup = this.buildBoardAndTable();
        Group diceGroup = this.buildDice();
        Group userPropertyCardsGroup = this.buildPropertyDecks();
        this.diceCup.setDiceOne(this.diceOne);
        this.diceCup.setDiceTwo(this.diceTwo);
        Group indicatorGroup = this.buildIndicator();
        this.capitalGroup = this.buildCapital();
        Group stationGroup = this.buildTrainSign();
        this.world.getChildren().addAll(new Node[]{playerGroup, diceGroup, indicatorGroup, userPropertyCardsGroup, this.capitalGroup, stationGroup});
        Group lightGroup = this.buildLight(new Node[]{indicatorGroup, stationGroup, diceGroup});
        root.getChildren().addAll(new Node[]{lightGroup});
        this.world.getChildren().add(this.buildPropertyDecks());
        this.perspectiveManager.setPerspective(Perspective.FLY_IN_POS, 200);
        ThreadRunner.onFX(() -> {
            this.logger.info("Starting gamescene fly in animation");
            this.perspectiveManager.setPerspective(Perspective.WHOLE_BOARD, 3000);
        }, 2500L);
        this.logger.info("Scheduling gamescene fly in animation");
    }

    public static ResourceBundle getResources() {
        if (resources == null) {
            return DataLoader.getInstance().getResourceBundle(ResourceBundleSource.GAME_SCENE, Locale.ENGLISH);
        }
        return resources;
    }

    public StackPane getStackPaneParent() {
        return this.initStackPane;
    }

    private void initPropertyCardDecks(GameController controller) {
        Player[] players = controller.getPlayers().toArray(new Player[controller.getPlayers().size()]);
        Player clientPlayer = controller.getClientPlayer();
        this.playerPropertyPerspectiveMap = new HashMap(4);
        this.propertyCardDecks = players.length == 0 ? new PropertyCardDeck[1] : new PropertyCardDeck[players.length];
        this.propertyCardDecks[0] = new PropertyCardDeck(clientPlayer);
        this.playerPropertyPerspectiveMap.put(clientPlayer, Perspective.PROPERTY_CARDS);
        Final<Integer> counter = new Final<Integer>(1);
        Arrays.stream(players).filter(player2 -> !clientPlayer.equals(player2)).forEach(player -> {
            this.propertyCardDecks[counter.value().intValue()] = new PropertyCardDeck((Player)player);
            this.playerPropertyPerspectiveMap.put((Player)player, Perspective.PROPERTY_PERSPECTIVES.get((Integer)counter.value()));
            counter.set((Integer)counter.value() + 1);
        });
    }

    public PerspectiveCameraManager getPerspectiveManager() {
        return this.perspectiveManager;
    }

    private Group buildCapital() {
        EnhancedGroup group = new EnhancedGroup();
        group.getChildren().add(this.capitalChipView.draw());
        group.setTranslateZ(-1000.0);
        group.setTranslateX(200.0);
        return group;
    }

    private Group buildPropertyDecks() {
        EnhancedGroup stacks = new EnhancedGroup();
        Stream.of(this.propertyCardDecks).forEach(deck -> deck.setOnMouseClick(() -> this.showListOfProperties(deck.getPlayer())));
        Stream.of(this.propertyCardDecks).forEach(deck -> stacks.getChildren().add(deck.draw()));
        ((Node)stacks.getChildren().get(0)).setTranslateZ(-700.0);
        if (stacks.getChildren().size() >= 2) {
            ((Node)stacks.getChildren().get(1)).setTranslateZ(700.0);
            ((Node)stacks.getChildren().get(1)).setRotationAxis(Rotate.Y_AXIS);
            ((Node)stacks.getChildren().get(1)).setRotate(180.0);
        }
        if (stacks.getChildren().size() >= 3) {
            ((Node)stacks.getChildren().get(2)).setTranslateX(700.0);
            ((Node)stacks.getChildren().get(2)).setRotationAxis(Rotate.Y_AXIS);
            ((Node)stacks.getChildren().get(2)).setRotate(270.0);
        }
        if (stacks.getChildren().size() >= 4) {
            ((Node)stacks.getChildren().get(3)).setTranslateX(-700.0);
            ((Node)stacks.getChildren().get(3)).setRotationAxis(Rotate.Y_AXIS);
            ((Node)stacks.getChildren().get(3)).setRotate(90.0);
        }
        return new Group(new Node[]{stacks});
    }

    public void showListOfProperties(Player player) {
        if (player.getPropertyList().isEmpty()) {
            return;
        }
        this.darkenScene();
        this.hideLastPreview();
        this.perspectiveManager.setPerspective(this.playerPropertyPerspectiveMap.get(player), 1000);
        this.listOfPropsPane = (AnchorPane)FXMLFile.PROP_LIST.toLayout((this).getClass());
        Label titleLabel = (Label)this.listOfPropsPane.lookup("#titlelabel");
        String title = resources.getString("propslist_title");
        title = String.format(title, player.getName());
        titleLabel.setText(title);
        Button doneButton = (Button)this.listOfPropsPane.lookup("#donebutton");
        doneButton.setText(resources.getString("propslist_done"));
        ImageView checkView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CHECK));
        checkView.setFitHeight(25.0);
        checkView.setFitWidth(25.0);
        doneButton.setGraphic((Node)checkView);
        doneButton.setCursor(Cursor.HAND);
        Label moneyLabel = (Label)this.listOfPropsPane.lookup("#moneyLabel");
        player.getCapital().addListener(e -> {
            if (player.getUser().getLocale().equals(Locale.ENGLISH)) {
                moneyLabel.setText("LPD " + player.getMoneyAmount());
            } else {
                moneyLabel.setText(player.getMoneyAmount() + " LPD");
            }
        });
        if (player.getUser().getLocale().equals(Locale.ENGLISH)) {
            moneyLabel.setText("LPD " + player.getMoneyAmount());
        } else {
            moneyLabel.setText(player.getMoneyAmount() + " LPD");
        }
        ListView propsList = (ListView)this.listOfPropsPane.lookup("#listview");
        ObservableList items = FXCollections.observableArrayList(player.getPropertyList());
        propsList.setItems(items);
        propsList.setCellFactory(list -> new PropertyCardCellRenderer((List<Property>)items, false, true));
        propsList.setOnMousePressed(e -> propsList.getSelectionModel().clearSelection());
        this.gameScenePane.getChildren().add(this.listOfPropsPane);
        this.listOfPropsPane.prefWidthProperty().bind((ObservableValue)this.gameScenePane.widthProperty());
        this.listOfPropsPane.setLayoutY(this.gameScenePane.getHeight());
        TranslateTransition trans = new TranslateTransition(Duration.seconds((double)1.0), (Node)this.listOfPropsPane);
        trans.setInterpolator(Interpolator.EASE_OUT);
        trans.setToY(-this.listOfPropsPane.getPrefHeight());
        this.gameScenePane.heightProperty().addListener((observable, oldValue, newValue) -> this.listOfPropsPane.setLayoutY(this.gameScenePane.getHeight()));
        trans.play();
        doneButton.setOnAction(e -> this.hideListOfProps());
    }

    public void hideListOfProps() {
        this.stopDarkeningScene();
        TranslateTransition trans2 = new TranslateTransition(Duration.seconds((double)1.0), (Node)this.listOfPropsPane);
        trans2.setInterpolator(Interpolator.EASE_IN);
        trans2.setToY(0.0);
        trans2.setOnFinished(ev -> this.gameScenePane.getChildren().remove(this.listOfPropsPane));
        trans2.play();
        this.showBoardView();
    }

    private void assignVariables() {
        this.textGroup = new EnhancedGroup();
        this.diceOne = new Dice(GameSceneModelSource.DICE_1);
        this.diceTwo = new Dice(GameSceneModelSource.DICE_2);
        this.indicator = new Indicator();
        this.playerIndicator = new PlayerIndicator();
        this.world = new EnhancedGroup();
    }

    public void hideLastPreview() {
        if (this.previewPopOver != null) {
            this.previewPopOver.hide();
        }
        this.lastPopOverMouseLocation = null;
        PreviewManager.resetLastDrawable();
    }

    private void showPreview(Node preview) {
        if (preview == null || Perspective.PROPERTY_PERSPECTIVES.contains(this.perspectiveManager.getPerspective())) {
            return;
        }
        this.hideLastPreview();
        this.previewPopOver = new PopOver(preview);
        this.previewPopOver.setDetachable(false);
        this.previewPopOver.setAutoHide(false);
        this.previewPopOver.setAutoFix(true);
        this.previewPopOver.setHideOnEscape(true);
        this.previewPopOver.setArrowLocation(PopOver.ArrowLocation.LEFT_CENTER);
        this.previewPopOver.setOpacity(1.0);
        double screenX = PreviewManager.getPreviewScreenX();
        double screenY = PreviewManager.getPreviewScreenY();
        if (screenX >= 0.0 && screenY >= 0.0) {
            javafx.geometry.Point2D local = this.screenToLocal(screenX, screenY);
            this.lastPopOverMouseLocation = new Point((int)screenX, (int)screenY);
            this.previewPopOver.show((Node)this, local.getX() + 20.0, local.getY());
        } else {
            this.previewPopOver.show((Node)this, this.getWidth() * 0.6, this.getHeight() * 0.4);
        }
        preview.setOnMouseEntered(e -> this.previewPopOver.setOpacity(1.0));
    }

    private void initMouseHandlers() {
        this.setOnMousePressed(event -> this.perspectiveManager.onMousePressed((MouseEvent)event, this.gameScenePane.getHeight()));
        this.setOnMouseReleased(this.perspectiveManager::onMouseReleased);
        this.setOnMouseDragged(me -> {
            this.hideLastPreview();
            this.perspectiveManager.onMouseDragged((MouseEvent)me);
        });
        this.setOnScroll(this.perspectiveManager::onMouseScrolled);
        this.setOnMouseMoved(e -> {
            Point newMouseLoc = MouseInfo.getPointerInfo().getLocation();
            if (this.lastPopOverMouseLocation == null || this.previewPopOver == null || !this.previewPopOver.isShowing()) {
                this.lastPopOverMouseLocation = newMouseLoc;
                return;
            }
            double dist = this.lastPopOverMouseLocation.distance(newMouseLoc);
            if (dist > 150.0) {
                this.hideLastPreview();
                PreviewManager.resetLastDrawable();
            }
        });
    }

    private PerspectiveCameraManager buildPerspectiveCamera() {
        EnhancedGroup camXYRotation = new EnhancedGroup();
        EnhancedGroup camXYTranslation = new EnhancedGroup();
        EnhancedGroup camZRotation = new EnhancedGroup();
        this.rootGroup.getChildren().add(camXYRotation);
        camXYRotation.getChildren().add(camXYTranslation);
        camXYTranslation.getChildren().add(camZRotation);
        camZRotation.getChildren().add(this.camera);
        for (Figure figure : this.board.getFigures()) {
            figure.getFigureGroup().setRy(camXYRotation.getRy().getAngle() + 85.0);
        }
        return new PerspectiveCameraManager(this.camera, camXYTranslation, camXYRotation, camZRotation);
    }

    private Group buildBoardAndTable() {
        EnhancedGroup group = new EnhancedGroup();
        Node drawnBoard = this.board.draw();
        group.getChildren().add(drawnBoard);
        drawnBoard.setOnMouseClicked(e -> {
            if (Perspective.PROPERTY_PERSPECTIVES.contains(this.perspectiveManager.getPerspective())) {
                this.perspectiveManager.setPerspective(Perspective.WHOLE_BOARD, 1000);
                this.perspectiveManager.setPolicy(CameraPolicy.DEFAULT);
                for (PropertyCardDeck aPropertyCardDeck : this.propertyCardDecks) {
                    aPropertyCardDeck.showCardStackView();
                }
            }
        });
        Box table = new Box(2160.0, 40.0, 2160.0);
        PhongMaterial tableMat = de.hhn.seb.labsw.laspoly.view.paint.Material.textured(DataLoader.getInstance().getGameImage(GameImage.TABLE_PATTERN));
        table.setMaterial((Material)tableMat);
        table.setTranslateY(-table.getHeight() / 2.0 - 2.0);
        group.getChildren().add(table);
        return group;
    }

    private Group buildDice() {
        EnhancedGroup group = new EnhancedGroup();
        group.getChildren().add(this.diceCup.draw());
        group.getChildren().add(this.diceOne.draw());
        group.getChildren().add(this.diceTwo.draw());
        return group;
    }

    private Group buildTrainSign() {
        EnhancedGroup group = new EnhancedGroup();
        for (int i = 0; i < 4; ++i) {
            try {
                EnhancedGroup trainSign = DataLoader.getInstance().getGameSceneForm(GameSceneModelSource.TRAIN_SIGN).clone();
                trainSign.setTranslateY(10.0);
                switch (i) {
                    case 0: {
                        trainSign.setTz(-450.0);
                        trainSign.setTx(45.0);
                        trainSign.setRy(-90.0);
                        break;
                    }
                    case 1: {
                        trainSign.setTz(-45.0);
                        trainSign.setTx(-450.0);
                        break;
                    }
                    case 2: {
                        trainSign.setTz(450.0);
                        trainSign.setTx(0.0);
                        trainSign.setRy(90.0);
                        trainSign.setTx(-45.0);
                        break;
                    }
                    case 3: {
                        trainSign.setTz(45.0);
                        trainSign.setTx(450.0);
                        trainSign.setRy(180.0);
                        break;
                    }
                }
                trainSign.setTy(2.0);
                trainSign.setScale(30.0);
                group.getChildren().add(trainSign);
                continue;
            }
            catch (CloneNotSupportedException e) {
                this.logger.severe(e.getMessage());
            }
        }
        return group;
    }

    private Group buildIndicator() {
        EnhancedGroup group = new EnhancedGroup();
        group.getChildren().add(this.indicator.draw());
        group.getChildren().add(this.playerIndicator.draw());
        return group;
    }

    private void darkenScene() {
        if (this.darkenPane == null) {
            this.darkenPane = new Pane();
            this.darkenPane.setStyle("-fx-background-color: rgba(27, 29, 24, 0.64);");
            this.gameScenePane.getChildren().add(this.darkenPane);
            this.darkenPane.prefWidthProperty().bind((ObservableValue)this.gameScenePane.widthProperty());
            this.darkenPane.prefHeightProperty().bind((ObservableValue)this.gameScenePane.heightProperty());
        }
    }

    private void stopDarkeningScene() {
        if (this.darkenPane == null) {
            return;
        }
        this.gameScenePane.getChildren().remove(this.darkenPane);
        this.darkenPane = null;
    }

    private Group buildLight(Node ... nodesToLightUpAlways) {
        Group group = new Group();
        PointLight sun1 = new PointLight(Color.WHITE);
        PointLight sun2 = new PointLight(Color.WHITE);
        sun1.setTranslateY(7000.0);
        sun2.setTranslateY(8000.0);
        sun1.setTranslateX(-9600.0);
        sun2.setTranslateX(9600.0);
        sun1.setTranslateZ(-9600.0);
        sun2.setTranslateZ(4800.0);
        AmbientLight ambientLight = new AmbientLight(Color.GRAY);
        ambientLight.setTranslateY(1000.0);
        ambientLight.getScope().addAll(nodesToLightUpAlways);
        for (Figure f : this.board.getFigures()) {
            ambientLight.getScope().add(f.draw());
        }
        group.getChildren().addAll(new Node[]{sun1, sun2, ambientLight});
        return group;
    }

    public Field[] getFields() {
        return this.board.getFields();
    }

    public void showBoardView() {
        this.perspectiveManager.setPerspective(Perspective.WHOLE_BOARD, 1000);
        this.perspectiveManager.setPolicy(CameraPolicy.DEFAULT);
        for (PropertyCardDeck aPropertyCardDeck : this.propertyCardDecks) {
            aPropertyCardDeck.showCardStackView();
        }
    }

    public boolean showsListOfProps() {
        return this.listOfPropsPane != null && this.gameScenePane.getChildren().contains(this.listOfPropsPane);
    }

    private void prepareSwapOfferView() {
        this.gameController.hideChatPane();
        this.hideLastPreview();
        this.showBoardView();
        this.hideListOfProps();
        this.darkenScene();
    }

    public void setGameSceneArea(Pane gameSceneArea) {
        this.gameScenePane = gameSceneArea;
        this.initStackPane = (StackPane)this.gameScenePane.getParent().lookup("#gamescenestack");
        ProgressIndicator initProgInd = (ProgressIndicator)this.initStackPane.lookup("#progressindicator");
        ThreadRunner.onFX(() -> this.initStackPane.getChildren().remove(initProgInd), 1500L);
    }

    public void onKeyPressed(KeyCode code) {
        if (this.gameController.isChatPaneVisible()) {
            return;
        }
        switch (code) {
            case PLUS: {
                this.perspectiveManager.zoomIn();
                break;
            }
            case MINUS: {
                this.perspectiveManager.zoomOut();
                break;
            }
        }
    }

    public void onKeyPressed(KeySettings.KeyAction action) {
        switch (action) {
            case SHOW_BOARD_VIEW: {
                this.showBoardView();
                break;
            }
        }
    }

    public void setOnTurn() {
        this.diceCup.setActive();
        this.indicator.showIndicator(Indicator.IndicatorPosition.POSITION_DICE_CUP);
        this.playerIndicator.show(this.gameController.getClientPlayer());
    }

    public void setOnTurnDice() {
        this.diceCup.setActive();
        this.indicator.showIndicator(Indicator.IndicatorPosition.POSITION_DICE_CUP);
    }

    public void finishTurn() {
        this.diceCup.disableDices();
        this.indicator.hide();
        this.playerIndicator.hide();
    }

    public PlayerIndicator getPlayerIndicator() {
        return this.playerIndicator;
    }

    public Indicator getIndicator() {
        return this.indicator;
    }

    public ActionCardDeck getCardDeck() {
        return this.board.getCardDeck();
    }

    public void setDiceActive() {
        this.diceCup.setDiceActive();
        this.indicator.showIndicator(Indicator.IndicatorPosition.POSITION_DICE);
        this.playerIndicator.show(this.gameController.getPlayer(this.gameController.getCurrent()));
    }

    public void showActionCard(ActionCard actionCard) {
        if (this.curActionCardNode != null) {
            this.hideActionCard();
            this.logger.severe("Last Actioncard was still showing on screen");
        }
        this.indicator.showIndicator(Indicator.IndicatorPosition.POSITION_CARD_DECK);
        this.board.getCardDeck().getNodes().getUppermostCard().setCursor(Cursor.HAND);
        this.curActionCardNode = actionCard.drawPreview();
        this.curActionCard = actionCard;
        this.curActionCard.getOptionOne().setDisable(true);
        this.curActionCard.getOptionTwo().setDisable(true);
        this.curActionCard.getConfirm().setDisable(true);
    }

    private void showActionCard() {
        if (this.curActionCardNode == null) {
            return;
        }
        this.board.getCardDeck().getNodes().getUppermostCard().setCursor(Cursor.DEFAULT);
        this.perspectiveManager.setPerspective(Perspective.ACTION_CARD_DECK, 1300);
        this.perspectiveManager.setPolicy(CameraPolicy.NO_INTERACTION);
        Box upperCard = this.getCardDeck().getNodes().getUppermostCard();
        this.curActionCardNode.setTx(upperCard.getTranslateX());
        this.curActionCardNode.setTy(upperCard.getTranslateY() - 10.0);
        this.curActionCardNode.setTz(upperCard.getTranslateZ() + 180.0);
        this.curActionCardNode.setRx(90.0);
        this.curActionCardNode.setRy(45.0);
        this.curActionCardNode.setRz(upperCard.getTranslateZ());
        this.world.getChildren().add(this.curActionCardNode);
        this.hideLastPreview();
        final Duration cardAnimDur = Duration.millis((double)1300.0);
        TranslateTransition translateTransition = new TranslateTransition(cardAnimDur, (Node)this.curActionCardNode);
        translateTransition.setToX(700.0);
        translateTransition.setToY(300.0);
        translateTransition.setToZ(-350.0);
        Transition angleT = new Transition(){
            private final double xStart;
            private final double yStart;
            private final double xRotDelta;
            private final double yRotDelta;
            {
                this.xStart = GameScene.this.curActionCardNode.getRx().getAngle();
                this.yStart = GameScene.this.curActionCardNode.getRy().getAngle();
                this.xRotDelta = (35.0 - this.xStart) % 360.0;
                this.yRotDelta = (-90.0 - this.yStart) % 360.0;
                this.setCycleDuration(cardAnimDur);
            }

            protected void interpolate(double frac) {
                GameScene.this.curActionCardNode.setRx(this.xStart + frac * this.xRotDelta);
                GameScene.this.curActionCardNode.setRy(this.yStart + frac * this.yRotDelta);
            }
        };
        ParallelTransition cardAnim = new ParallelTransition(new Animation[]{translateTransition, angleT});
        cardAnim.setOnFinished(e -> {
            this.darkenScene();
            Pane pane = this.curActionCard.drawPreviewPane();
            FadeTransition trans1 = new FadeTransition(Duration.millis((double)200.0), (Node)this.curActionCardNode);
            trans1.setFromValue(1.0);
            trans1.setToValue(0.8);
            trans1.play();
            trans1.setOnFinished(onFinish -> {
                this.world.getChildren().remove(this.curActionCardNode);
                this.curActionCardNode.reset();
                this.curActionCardNode.setRz(180.0);
                this.curActionCardNode.setTranslateX(this.gameScenePane.getWidth() / 2.0 + 175.0);
                this.curActionCardNode.setTranslateY(this.gameScenePane.getHeight() / 2.0 + 100.0);
                this.curActionCardNode.setTranslateZ(0.0);
                this.curActionCardNode.setScale(1.0);
                this.gameScenePane.heightProperty().addListener(ev -> this.centerInGameScenePane((Region)pane));
                this.gameScenePane.widthProperty().addListener(ev -> this.centerInGameScenePane((Region)pane));
                this.gameScenePane.getChildren().addAll(new Node[]{this.curActionCardNode});
                this.curActionCard.getOptionOne().setDisable(false);
                this.curActionCard.getOptionTwo().setDisable(false);
                this.curActionCard.getConfirm().setDisable(false);
                FadeTransition trans = new FadeTransition(Duration.millis((double)50.0), (Node)this.curActionCardNode);
                trans.setFromValue(0.8);
                trans.setToValue(1.0);
                trans.play();
            });
        });
        ThreadRunner.onFX(() -> ((ParallelTransition)cardAnim).play(), 0L);
    }

    public void hideActionCard() {
        if (this.curActionCardNode == null) {
            return;
        }
        this.stopDarkeningScene();
        this.gameScenePane.getChildren().remove(this.curActionCardNode);
        this.curActionCardNode = null;
        this.perspectiveManager.setPerspective(Perspective.WHOLE_BOARD, 2000);
        this.perspectiveManager.setPolicy(CameraPolicy.DEFAULT);
    }

    public void setupActionCardDeck() {
        this.board.setupActionCardDeck();
    }

    private Transition makeSwapOfferTransition(Region region) {
        this.gameScenePane.getChildren().addAll(new Node[]{region});
        region.setScaleX(0.0);
        region.setScaleY(0.0);
        ScaleTransition trans = new ScaleTransition(Duration.seconds((double)1.0), (Node)region);
        trans.setInterpolator(Interpolator.EASE_OUT);
        trans.setToX(1.0);
        trans.setToY(1.0);
        return trans;
    }

    public void createSwapOffer(Property property) {
        this.darkenScene();
        this.prepareSwapOfferView();
        NewSwapOfferController swapOffer = NewSwapOfferController.newInstance((this).getClass());
        AnchorPane pane = swapOffer.getRootPane();
        this.gameScenePane.widthProperty().addListener(e -> this.centerInGameScenePane((Region)pane));
        this.gameScenePane.heightProperty().addListener(e -> this.centerInGameScenePane((Region)pane));
        swapOffer.importAction(property, this.gameController);
        swapOffer.setOnCancelListener(this.createSwapOfferNegativeListener(swapOffer));
        swapOffer.setOnDoneListener(this.createSwapOfferPositiveListener(swapOffer));
        this.makeSwapOfferTransition((Region)pane).play();
        ThreadRunner.onFX(() -> this.centerInGameScenePane((Region)pane), 10L);
    }

    public void createSwapOffer(Player receiver) {
        this.darkenScene();
        this.prepareSwapOfferView();
        NewSwapOfferController swapOffer = NewSwapOfferController.newInstance((this).getClass());
        AnchorPane pane = swapOffer.getRootPane();
        this.gameScenePane.widthProperty().addListener(e -> this.centerInGameScenePane((Region)pane));
        this.gameScenePane.heightProperty().addListener(e -> this.centerInGameScenePane((Region)pane));
        swapOffer.importAction(receiver, this.gameController);
        swapOffer.setOnCancelListener(this.createSwapOfferNegativeListener(swapOffer));
        swapOffer.setOnDoneListener(this.createSwapOfferPositiveListener(swapOffer));
        this.makeSwapOfferTransition((Region)pane).play();
        ThreadRunner.onFX(() -> this.centerInGameScenePane((Region)pane), 10L);
    }

    private Runnable createSwapOfferPositiveListener(NewSwapOfferController swapOffer) {
        return () -> {
            System.out.println("on positive clicked");
            SwapOfferAction previousAction = swapOffer.exportAction();
            switch (previousAction.getStatus()) {
                case OPEN: {
                    previousAction.setStatus(SwapOfferAction.Status.SENT);
                    break;
                }
                case EDITING_BY_RECEIVER: {
                    previousAction.setStatus(SwapOfferAction.Status.CHANGED_BY_RECEIVER);
                    break;
                }
                case EDITING_BY_SENDER: {
                    previousAction.setStatus(SwapOfferAction.Status.CHANGED_BY_SENDER);
                    break;
                }
                case SENT: 
                case CHANGED_BY_RECEIVER: 
                case CHANGED_BY_SENDER: {
                    previousAction.setStatus(SwapOfferAction.Status.ACCEPTED);
                    break;
                }
                default: {
                    this.logger.severe("Swap offer attachment contained a suspicious status (" + previousAction.getStatus() + ")");
                }
            }
            System.out.println("adding action " + previousAction);
            this.gameController.addAction(previousAction);
            this.logger.info("adding action " + previousAction);
            this.gameScenePane.getChildren().remove(swapOffer.getRootPane());
            this.stopDarkeningScene();
        };
    }

    private Runnable createSwapOfferNegativeListener(NewSwapOfferController swapOffer) {
        return () -> {
            System.out.println("on negative clicked");
            this.perspectiveManager.setPolicy(CameraPolicy.DEFAULT);
            this.gameScenePane.getChildren().remove(swapOffer.getRootPane());
            this.stopDarkeningScene();
            SwapOfferAction previousAction = swapOffer.exportAction();
            if (previousAction.getStatus() == SwapOfferAction.Status.OPEN) {
                return;
            }
            if (previousAction.getStatus() == SwapOfferAction.Status.CHANGED_BY_SENDER || previousAction.getStatus() == SwapOfferAction.Status.EDITING_BY_RECEIVER || previousAction.getStatus() == SwapOfferAction.Status.SENT) {
                previousAction.setStatus(SwapOfferAction.Status.DECLINED_BY_RECEIVER);
            } else {
                previousAction.setStatus(SwapOfferAction.Status.DECLINED_BY_SENDER);
            }
            System.out.println("adding action " + previousAction);
            this.gameController.addAction(previousAction);
            this.logger.info("adding action " + previousAction);
        };
    }

    private void centerInGameScenePane(Region pane) {
        double horSpace = this.gameScenePane.getWidth() - pane.getWidth();
        double verSpace = this.gameScenePane.getHeight() - pane.getHeight();
        pane.setLayoutX(horSpace / 2.0);
        pane.setLayoutY(verSpace / 2.0);
    }

    public void onReceiveSwapOffer(SwapOfferAction swapOfferAction) {
        this.logger.info("receiving " + swapOfferAction);
        switch (swapOfferAction.getStatus()) {
            case SENT: 
            case CHANGED_BY_RECEIVER: 
            case CHANGED_BY_SENDER: {
                this.showReceivedSwapOfferDialog(swapOfferAction);
                break;
            }
            default: {
                this.logger.severe("GameScene received a swapoffer with an unexpected status (" + swapOfferAction.getStatus() + ")");
            }
        }
    }

    private void showReceivedSwapOfferDialog(SwapOfferAction swapOfferAction) {
        this.logger.info("showing swap offer dialog of " + swapOfferAction);
        SwapOfferDialog dialog = new SwapOfferDialog(resources, this.gameScenePane, swapOfferAction);
        dialog.setListeners(wasIgnored -> {
            dialog.hide();
            if (wasIgnored.booleanValue()) {
                this.onIgnoreReceivedSwapOfferClicked(swapOfferAction);
            } else {
                this.onViewReceivedSwapOfferClicked(swapOfferAction);
            }
        });
        dialog.getLayout().setLayoutY(50.0);
        dialog.show();
    }

    private void onIgnoreReceivedSwapOfferClicked(SwapOfferAction swapOfferAction) {
        if (swapOfferAction.getStatus() == SwapOfferAction.Status.SENT || swapOfferAction.getStatus() == SwapOfferAction.Status.CHANGED_BY_SENDER) {
            swapOfferAction.setStatus(SwapOfferAction.Status.DECLINED_BY_RECEIVER);
        } else {
            swapOfferAction.setStatus(SwapOfferAction.Status.DECLINED_BY_SENDER);
        }
        this.gameController.addAction(swapOfferAction);
        this.logger.info("adding action " + swapOfferAction);
    }

    private void onViewReceivedSwapOfferClicked(SwapOfferAction swapOfferAction) {
        NewSwapOfferController swapOffer = NewSwapOfferController.newInstance((this).getClass());
        swapOffer.importAction(swapOfferAction, this.gameController);
        this.prepareSwapOfferView();
        AnchorPane pane = swapOffer.getRootPane();
        this.gameScenePane.widthProperty().addListener(e -> this.centerInGameScenePane((Region)pane));
        this.gameScenePane.heightProperty().addListener(e -> this.centerInGameScenePane((Region)pane));
        swapOffer.setOnCancelListener(this.createSwapOfferNegativeListener(swapOffer));
        swapOffer.setOnDoneListener(this.createSwapOfferPositiveListener(swapOffer));
        this.makeSwapOfferTransition((Region)pane).play();
        ThreadRunner.onFX(() -> this.centerInGameScenePane((Region)pane), 10L);
    }

    public void showTravelDialog(TrainStation current) {
        this.hideLastPreview();
        this.darkenScene();
        int[] prices = new int[]{TrainStation.PRICE_INFO.getRent(2), TrainStation.PRICE_INFO.getRent(3), TrainStation.PRICE_INFO.getRent(4)};
        ArrayList<TrainStation> otherStations = new ArrayList<TrainStation>();
        ArrayList<String> otherStationNames = new ArrayList<String>();
        Field[] allFields = FieldConfiguration.getFields();
        for (int i = current.getPosition(); i != current.getPosition() - 1; ++i) {
            Field f = allFields[i];
            if (f instanceof TrainStation && f != current) {
                otherStations.add((TrainStation)f);
                otherStationNames.add(f.getName());
            }
            if (i != allFields.length - 1) continue;
            i = 0;
        }
        AnchorPane pane = (AnchorPane)FXMLFile.TICKET.toLayout((this).getClass());
        ComboBox comboBox = (ComboBox)pane.lookup("#combobox");
        Label stationLabel = (Label)pane.lookup("#stationlabel");
        Label priceLabel = (Label)pane.lookup("#pricelabel");
        Button buyButton = (Button)pane.lookup("#buyButton");
        Button cancelButton = (Button)pane.lookup("#cancelButton");
        stationLabel.setText(GameScene.getResources().getString("traveldialog_ticketto"));
        buyButton.setText(GameScene.getResources().getString("traveldialog_okbuttontext"));
        cancelButton.setText(GameScene.getResources().getString("traveldialog_cancelbuttontext"));
        comboBox.setItems(FXCollections.observableArrayList(otherStationNames));
        Final<Integer> selStationInd = new Final<Integer>(0);
        comboBox.setOnAction(e -> {
            selStationInd.set(comboBox.getSelectionModel().getSelectedIndex());
            if (prices[(Integer)selStationInd.value()] > this.gameController.getClientPlayer().getMoneyAmount()) {
                priceLabel.setText(GameScene.getResources().getString("traveldialog_cantafford"));
                buyButton.setDisable(true);
            } else {
                buyButton.setDisable(false);
                String priceText = GameScene.getResources().getString("traveldialog_price");
                priceLabel.setText(String.format(priceText, prices[(Integer)selStationInd.value()]));
            }
        });
        comboBox.getSelectionModel().select(0);
        String priceText = GameScene.getResources().getString("traveldialog_price");
        priceLabel.setText(String.format(priceText, prices[0]));
        ImageView checkView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CHECK));
        checkView.setFitHeight(25.0);
        checkView.setFitWidth(25.0);
        buyButton.setGraphic((Node)checkView);
        ImageView cross = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CROSS));
        cross.setFitHeight(25.0);
        cross.setFitWidth(25.0);
        cancelButton.setGraphic((Node)cross);
        buyButton.setCursor(Cursor.HAND);
        cancelButton.setCursor(Cursor.HAND);
        buyButton.setOnAction(e -> {
            int selectedStation = comboBox.getSelectionModel().getSelectedIndex();
            this.gameController.handleTravel((TrainStation)otherStations.get(selectedStation), prices[(Integer)selStationInd.value()]);
            this.stopDarkeningScene();
            this.gameScenePane.getChildren().remove(pane);
        });
        cancelButton.setOnAction(e -> {
            this.gameScenePane.getChildren().remove(pane);
            this.stopDarkeningScene();
        });
        this.gameScenePane.getChildren().add(pane);
        ThreadRunner.onFX(() -> this.centerInGameScenePane((Region)pane), 40L);
        this.gameScenePane.widthProperty().addListener(e -> this.centerInGameScenePane((Region)pane));
        this.gameScenePane.heightProperty().addListener(e -> this.centerInGameScenePane((Region)pane));
    }

    public void showMortgageDialog(Runnable onActionCallback) {
        this.darkenScene();
        this.hideLastPreview();
        AnchorPane pane = (AnchorPane)FXMLFile.MORTGAGE_DIALOG.toLayout((this).getClass());
        Label titleLabel = (Label)pane.lookup("#title");
        Label descrLabel = (Label)pane.lookup("#description");
        Button okButton = (Button)pane.lookup("#okButton");
        Button cancelButton = (Button)pane.lookup("#cancelButton");
        titleLabel.setText(resources.getString("mortgagedialog_title"));
        descrLabel.setText(resources.getString("mortgagedialog_descr"));
        cancelButton.setText(resources.getString("mortgagedialog_cancel"));
        okButton.setText(resources.getString("mortgagedialog_ok"));
        cancelButton.setGraphic((Node)GameImage.CROSS.toButtonGraphic());
        cancelButton.setCursor(Cursor.HAND);
        okButton.setGraphic((Node)GameImage.CHECK.toButtonGraphic());
        okButton.setCursor(Cursor.HAND);
        this.gameScenePane.getChildren().addAll(new Node[]{pane});
        this.gameScenePane.widthProperty().addListener(e -> this.centerInGameScenePane((Region)pane));
        this.gameScenePane.heightProperty().addListener(e -> this.centerInGameScenePane((Region)pane));
        ThreadRunner.onFX(() -> this.centerInGameScenePane((Region)pane), 40L);
        cancelButton.setOnAction(e -> {
            this.gameScenePane.getChildren().remove(pane);
            this.stopDarkeningScene();
        });
        okButton.setOnAction(e -> {
            this.gameScenePane.getChildren().remove(pane);
            this.stopDarkeningScene();
            onActionCallback.run();
        });
    }

    public void disableDices() {
        this.diceCup.disableDices();
        this.indicator.hide();
    }

    public Board getBoard() {
        return this.board;
    }
}

