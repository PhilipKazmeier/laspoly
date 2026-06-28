/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.Cursor
 *  javafx.scene.Node
 *  javafx.scene.control.Button
 *  javafx.scene.control.ButtonType
 *  javafx.scene.control.Dialog
 *  javafx.scene.control.Label
 *  javafx.scene.control.TextField
 *  javafx.scene.control.ToggleButton
 *  javafx.scene.image.Image
 *  javafx.scene.image.ImageView
 *  javafx.scene.layout.AnchorPane
 *  javafx.scene.layout.StackPane
 *  javafx.stage.Stage
 */
package de.hhn.seb.labsw.laspoly.main;

import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.StringValidator;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import de.hhn.seb.labsw.laspoly.utils.dataloading.ResourceBundleSource;
import java.util.Locale;
import java.util.Optional;
import java.util.ResourceBundle;
import java.util.logging.Logger;
import javafx.scene.Cursor;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.ButtonType;
import javafx.scene.control.Dialog;
import javafx.scene.control.Label;
import javafx.scene.control.TextField;
import javafx.scene.control.ToggleButton;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.AnchorPane;
import javafx.scene.layout.StackPane;
import javafx.stage.Stage;

public class UserDialogSetup {
    public static final int MIN_USER_NAME_LENGTH = 2;
    public static final int MAX_USER_NAME_LENGTH = 7;
    private static final int TEXTLIMIT = 30;
    private final ResourceBundleSource resBundle;
    private final Dialog<User> dialog;
    private final Logger logger = LoggerFactory.initializeLogger(this.getClass(), "de/hhn/seb/labsw/laspoly/main/main_logging.properties");
    private Locale selectedLocale;
    private ResourceBundle bundle;
    private TextField usernameField;
    private Label userNameLabel;
    private Label languageLabel;
    private Button submitButton;
    private Button cancelButton;
    private Label errorLabel;
    private boolean anotherUser;

    public UserDialogSetup(Locale locale, String userName, boolean another) {
        this(ResourceBundleSource.CHANGE_DIALOG, locale, userName, another);
    }

    private UserDialogSetup(ResourceBundleSource bundleSource, Locale locale, String userName, boolean another) {
        this.resBundle = bundleSource;
        this.selectedLocale = locale;
        this.bundle = DataLoader.getInstance().getResourceBundle(bundleSource, this.selectedLocale);
        this.anotherUser = another;
        this.dialog = new Dialog();
        if (this.anotherUser && bundleSource.equals(ResourceBundleSource.GET_USER_DETAIL_DIALOG)) {
            this.dialog.setTitle(this.bundle.getString("anotherTitle"));
            this.dialog.setHeaderText(this.bundle.getString("anotherHeader"));
        } else {
            this.dialog.setTitle(this.bundle.getString("title"));
            this.dialog.setHeaderText(this.bundle.getString("header"));
        }
        this.dialog.setGraphic((Node)new ImageView(this.getClass().getResource("LasPolyIcon_64x64.png").toString()));
        this.setUpDialog(userName);
        this.updateLanguage();
    }

    public UserDialogSetup(Locale locale, boolean another) {
        this(ResourceBundleSource.GET_USER_DETAIL_DIALOG, locale, "", another);
    }

    private void setUpDialog(String userName) {
        this.logger.finer("Setting up the dialog");
        this.dialog.getDialogPane().getStylesheets().add(this.getClass().getResource("/de/hhn/seb/labsw/laspoly/alert.css").toExternalForm());
        this.dialog.getDialogPane().getStyleClass().add("alertStyle");
        this.dialog.getDialogPane().getButtonTypes().addAll(new ButtonType[]{ButtonType.OK, ButtonType.CANCEL});
        StackPane dialogRootPane = (StackPane)FXMLFile.USER_SETUP_DIALOG.toLayout(this.getClass());
        Stage stage = (Stage)this.dialog.getDialogPane().getScene().getWindow();
        stage.getIcons().add(new Image(this.getClass().getResourceAsStream("/de/hhn/seb/labsw/laspoly/view/LasPolyIcon_64x64.png")));
        this.usernameField = (TextField)dialogRootPane.lookup("#userNameField");
        this.usernameField.lengthProperty().addListener((observable, oldValue, newValue) -> {
            if (newValue.intValue() > oldValue.intValue() && this.usernameField.getText().length() >= 30) {
                this.usernameField.setText(this.usernameField.getText().substring(0, 30));
            }
        });
        ToggleButton toggleGerman = (ToggleButton)dialogRootPane.lookup("#germanToggle");
        ToggleButton toggleEnglish = (ToggleButton)dialogRootPane.lookup("#englishToggle");
        this.userNameLabel = (Label)dialogRootPane.lookup("#userNameLabel");
        this.languageLabel = (Label)dialogRootPane.lookup("#languageLabel");
        this.errorLabel = (Label)dialogRootPane.lookup("#userNameErrorlabel");
        this.errorLabel.setVisible(false);
        ImageView germanImageView = new ImageView(DataLoader.getInstance().getFlagImage(Locale.GERMAN));
        germanImageView.setFitHeight(30.0);
        germanImageView.setFitWidth(25.0);
        toggleGerman.setGraphic((Node)germanImageView);
        toggleGerman.setCursor(Cursor.HAND);
        toggleGerman.setOnAction(ev -> {
            if (this.selectedLocale == Locale.GERMAN) {
                toggleGerman.setSelected(true);
            } else {
                this.selectedLocale = Locale.GERMAN;
                this.updateLanguage();
            }
        });
        ImageView englishImageView = new ImageView(DataLoader.getInstance().getFlagImage(Locale.ENGLISH));
        englishImageView.setFitHeight(30.0);
        englishImageView.setFitWidth(25.0);
        toggleEnglish.setGraphic((Node)englishImageView);
        toggleEnglish.setCursor(Cursor.HAND);
        toggleEnglish.setOnAction(ev -> {
            if (this.selectedLocale == Locale.ENGLISH) {
                toggleEnglish.setSelected(true);
            } else {
                this.selectedLocale = Locale.ENGLISH;
                this.updateLanguage();
            }
        });
        toggleGerman.setSelected(this.selectedLocale.equals(Locale.GERMAN));
        toggleEnglish.setSelected(!this.selectedLocale.equals(Locale.GERMAN));
        AnchorPane connectionPane = (AnchorPane)dialogRootPane.lookup("#connectingToServerStack");
        connectionPane.setVisible(false);
        this.submitButton = (Button)this.dialog.getDialogPane().lookupButton(ButtonType.OK);
        this.cancelButton = (Button)this.dialog.getDialogPane().lookupButton(ButtonType.CANCEL);
        ImageView checkView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CHECK));
        checkView.setFitHeight(25.0);
        checkView.setFitWidth(25.0);
        this.submitButton.setGraphic((Node)checkView);
        this.submitButton.setCursor(Cursor.HAND);
        this.submitButton.getStyleClass().add("greenActionButton");
        ImageView crossView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CROSS));
        crossView.setFitHeight(25.0);
        crossView.setFitWidth(25.0);
        this.cancelButton.setGraphic((Node)crossView);
        this.cancelButton.setCursor(Cursor.HAND);
        this.cancelButton.getStyleClass().add("redActionButton");
        ((Button)this.dialog.getDialogPane().lookupButton(ButtonType.OK)).setPrefWidth(130.0);
        this.submitButton.setOnAction(a -> {
            this.logger.fine("Submit button was pressed");
            User user = new User(this.usernameField.getText(), this.selectedLocale);
            this.dialog.setResult(user);
        });
        this.usernameField.setText(userName);
        this.usernameField.textProperty().addListener((observable, oldValue, newValue) -> this.updateErrorLabel());
        this.dialog.getDialogPane().setContent((Node)dialogRootPane);
    }

    private void updateLanguage() {
        this.logger.finest("Updating the language of the dialog");
        this.bundle = DataLoader.getInstance().getResourceBundle(this.resBundle, this.selectedLocale);
        if (this.anotherUser) {
            this.dialog.setTitle(this.bundle.getString("anotherTitle"));
            this.dialog.setHeaderText(this.bundle.getString("anotherHeader"));
        } else {
            this.dialog.setTitle(this.bundle.getString("title"));
            this.dialog.setHeaderText(this.bundle.getString("header"));
        }
        this.userNameLabel.setText(this.bundle.getString("username"));
        this.languageLabel.setText(this.bundle.getString("language"));
        this.usernameField.setPromptText(this.bundle.getString("promptname"));
        this.submitButton.setText(this.bundle.getString("submit"));
        this.cancelButton.setText(this.bundle.getString("cancel"));
        this.updateErrorLabel();
    }

    private void updateErrorLabel() {
        this.errorLabel.setText(this.bundle.getString("errNameShort"));
        int userNameLength = this.usernameField.getText().length();
        boolean lengthOK = userNameLength >= 2 && userNameLength <= 7;
        boolean wordsOK = StringValidator.checkString(this.usernameField.getText());
        this.submitButton.setDisable(!lengthOK || !wordsOK);
        this.errorLabel.setVisible(this.submitButton.isDisable() && userNameLength > 0);
        if (lengthOK && !wordsOK) {
            this.errorLabel.setText(this.bundle.getString("errNameNotAllowed"));
        } else if (wordsOK && !lengthOK) {
            if (userNameLength < 2) {
                this.errorLabel.setText(this.bundle.getString("errNameShort"));
            } else if (userNameLength > 7) {
                this.errorLabel.setText(this.bundle.getString("errNameLong"));
            }
        }
    }

    public final Optional showAndWait() {
        this.dialog.getDialogPane().setMaxWidth(500.0);
        return this.dialog.showAndWait();
    }
}

