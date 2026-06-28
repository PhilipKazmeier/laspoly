/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.beans.property.SimpleStringProperty
 *  javafx.fxml.FXML
 *  javafx.fxml.Initializable
 *  javafx.scene.Cursor
 *  javafx.scene.Node
 *  javafx.scene.control.Accordion
 *  javafx.scene.control.Button
 *  javafx.scene.control.ButtonType
 *  javafx.scene.control.Dialog
 *  javafx.scene.control.Label
 *  javafx.scene.control.TableColumn
 *  javafx.scene.control.TableRow
 *  javafx.scene.control.TableView
 *  javafx.scene.control.TitledPane
 *  javafx.scene.image.ImageView
 *  javafx.scene.input.KeyCode
 *  javafx.scene.layout.AnchorPane
 */
package de.hhn.seb.labsw.laspoly.view.settings;

import de.hhn.seb.labsw.laspoly.model.settings.KeySettings;
import de.hhn.seb.labsw.laspoly.model.settings.Settings;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.StorageUtils;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import de.hhn.seb.labsw.laspoly.utils.dataloading.ResourceBundleSource;
import de.hhn.seb.labsw.laspoly.view.settings.SettingsController;
import de.hhn.seb.labsw.laspoly.view.settings.SettingsWindowController;
import java.net.URL;
import java.util.Optional;
import java.util.ResourceBundle;
import java.util.logging.Logger;
import javafx.beans.property.SimpleStringProperty;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.Cursor;
import javafx.scene.Node;
import javafx.scene.control.Accordion;
import javafx.scene.control.Button;
import javafx.scene.control.ButtonType;
import javafx.scene.control.Dialog;
import javafx.scene.control.Label;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableRow;
import javafx.scene.control.TableView;
import javafx.scene.control.TitledPane;
import javafx.scene.image.ImageView;
import javafx.scene.input.KeyCode;
import javafx.scene.layout.AnchorPane;

public class TabKeysController
implements Initializable,
SettingsController {
    private final Logger logger = LoggerFactory.initializeLogger(this.getClass(), "de/hhn/seb/labsw/laspoly/view/view_logging.properties");
    @FXML
    private Accordion root;
    @FXML
    private TitledPane general;
    @FXML
    private TitledPane game;
    @FXML
    private TableView<KeySettings.KeyAction> generalKeyBindingsTable;
    @FXML
    private TableView<KeySettings.KeyAction> gameKeyBindingsTable;
    @FXML
    private TableColumn<KeySettings.KeyAction, String> generalDescriptionColumn;
    @FXML
    private TableColumn<KeySettings.KeyAction, String> generalKeyBindingColumn;
    @FXML
    private TableColumn<KeySettings.KeyAction, String> gameDescriptionColumn;
    @FXML
    private TableColumn<KeySettings.KeyAction, String> gameKeyBindingColumn;
    private SettingsWindowController settingsWindowController;
    private ResourceBundle bundle;
    private KeySettings settings;

    public void initialize(URL location, ResourceBundle resources) {
        this.settings = (KeySettings)StorageUtils.loadSettings(Settings.Category.KEYS);
        this.root.setExpandedPane(this.general);
        this.generalKeyBindingsTable.setRowFactory(tv -> {
            TableRow row = new TableRow();
            row.setOnMouseClicked(event -> {
                if (event.getClickCount() == 2 && !row.isEmpty() && !((KeySettings.KeyAction)(((row.getItem())))).isFixed()) {
                    this.showChangeDialog((TableRow<KeySettings.KeyAction>)row);
                }
            });
            if (row.getItem() != null) {
                row.setCursor(Cursor.HAND);
            }
            return row;
        });
        this.gameKeyBindingsTable.setRowFactory(tv -> {
            TableRow row = new TableRow();
            row.setOnMouseClicked(event -> {
                if (event.getClickCount() == 2 && !row.isEmpty() && !((KeySettings.KeyAction)(((row.getItem())))).isFixed()) {
                    this.showChangeDialog((TableRow<KeySettings.KeyAction>)row);
                }
            });
            if (row.getItem() != null) {
                row.setCursor(Cursor.HAND);
            }
            return row;
        });
        this.generalDescriptionColumn.setCellValueFactory(param -> {
            String identifier = ((KeySettings.KeyAction)(param.getValue())).getIdentifier();
            return new SimpleStringProperty(this.bundle.getString(identifier));
        });
        this.generalKeyBindingColumn.setCellValueFactory(param -> {
            KeyCode code = this.settings.getKeyCode((KeySettings.KeyAction)(param.getValue()));
            String text = ((KeySettings.KeyAction)(param.getValue())).isFixed() ? code.getName() + " (" + this.bundle.getString("fixed") + ")" : "ALT + " + code.getName();
            return new SimpleStringProperty(text);
        });
        this.gameDescriptionColumn.setCellValueFactory(param -> {
            String identifier = ((KeySettings.KeyAction)(param.getValue())).getIdentifier();
            return new SimpleStringProperty(this.bundle.getString(identifier));
        });
        this.gameKeyBindingColumn.setCellValueFactory(param -> {
            KeyCode code = this.settings.getKeyCode((KeySettings.KeyAction)(param.getValue()));
            String text = ((KeySettings.KeyAction)(param.getValue())).isFixed() ? code.getName() : "ALT + " + code.getName();
            return new SimpleStringProperty(text);
        });
    }

    private void showChangeDialog(TableRow<KeySettings.KeyAction> row) {
        KeySettings.KeyAction keyAction = (KeySettings.KeyAction) row.getItem();
        Dialog dialog = new Dialog();
        dialog.getDialogPane().getStylesheets().add(this.getClass().getResource("/de/hhn/seb/labsw/laspoly/alert.css").toExternalForm());
        dialog.getDialogPane().getStyleClass().add("alertStyle");
        dialog.setTitle(this.settingsWindowController.getBundle().getString("title"));
        dialog.getDialogPane().getButtonTypes().addAll(new ButtonType[]{ButtonType.APPLY, ButtonType.CANCEL});
        Button submitButton = (Button)dialog.getDialogPane().lookupButton(ButtonType.APPLY);
        submitButton.setText(this.settingsWindowController.getBundle().getString("apply"));
        Button cancelButton = (Button)dialog.getDialogPane().lookupButton(ButtonType.CANCEL);
        cancelButton.setText(this.settingsWindowController.getBundle().getString("cancel"));
        ImageView checkView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CHECK));
        checkView.setFitHeight(25.0);
        checkView.setFitWidth(25.0);
        submitButton.setGraphic((Node)checkView);
        submitButton.setCursor(Cursor.HAND);
        submitButton.getStyleClass().add("actionButton");
        ImageView crossView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CROSS_GRAY));
        crossView.setFitHeight(25.0);
        crossView.setFitWidth(25.0);
        cancelButton.setGraphic((Node)crossView);
        cancelButton.setCursor(Cursor.HAND);
        cancelButton.getStyleClass().add("actionButton");
        AnchorPane pane = (AnchorPane)FXMLFile.KEY_SETTINGS_DIALOG.toLayout(this.getClass());
        KeyCode[] code = new KeyCode[]{this.settings.getKeyCode(keyAction)};
        Label keyValue = (Label)pane.lookup("#keyValue");
        Label pressKey = (Label)pane.lookup("#pressKey");
        Label error = (Label)pane.lookup("#error");
        pressKey.setText(this.settingsWindowController.getBundle().getString("pressKey") + ":");
        keyValue.setText(this.settings.getKeyCode(keyAction).getName());
        dialog.getDialogPane().setContent((Node)pane);
        dialog.getDialogPane().setOnKeyPressed(event -> {
            code[0] = event.getCode();
            if (!this.settings.containsKeyCode(code[0]) || this.settings.getKeyCode(keyAction) == code[0]) {
                keyValue.setText(event.getCode().getName());
                error.setText("");
            } else {
                error.setText(this.bundle.getString("keyAlreadyUsed"));
            }
        });
        Optional optional = dialog.showAndWait();
        optional.ifPresent(buttonType -> {
            if (buttonType.equals(ButtonType.APPLY)) {
                this.settings.setKeyCode(keyAction, code[0]);
                this.setupGeneralKeyBindings();
                this.setupGameKeyBindings();
                this.settingsWindowController.setUnsavedChanges(true);
            }
        });
    }

    public void setSettingsWindowController(SettingsWindowController controller) {
        this.settingsWindowController = controller;
        this.bundle = DataLoader.getInstance().getResourceBundle(ResourceBundleSource.KEY_ACTIONS, controller.getBundle().getLocale());
        this.general.setText(this.settingsWindowController.getBundle().getString("general"));
        this.game.setText(this.settingsWindowController.getBundle().getString("game"));
        this.generalDescriptionColumn.setText(this.settingsWindowController.getBundle().getString("description"));
        this.generalKeyBindingColumn.setText(this.settingsWindowController.getBundle().getString("keyBinding"));
        this.setupGeneralKeyBindings();
        this.setupGameKeyBindings();
    }

    private void setupGeneralKeyBindings() {
        this.generalKeyBindingsTable.getItems().clear();
        this.generalKeyBindingsTable.getItems().add(KeySettings.KeyAction.MUTE_UN_MUTE);
        this.generalKeyBindingsTable.getItems().add(KeySettings.KeyAction.FULL_SCREEN);
    }

    private void setupGameKeyBindings() {
        this.gameKeyBindingsTable.getItems().clear();
        this.gameKeyBindingsTable.getItems().add(KeySettings.KeyAction.ESC_GAME);
        this.gameKeyBindingsTable.getItems().add(KeySettings.KeyAction.SHOW_BOARD_VIEW);
    }

    @Override
    public void save() {
        this.settings.save();
    }
}

