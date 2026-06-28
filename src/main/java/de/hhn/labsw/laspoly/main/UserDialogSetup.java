package de.hhn.labsw.laspoly.main;
import de.hhn.labsw.laspoly.model.User;
import de.hhn.labsw.laspoly.utils.ImageCell;
import de.hhn.labsw.laspoly.utils.WordBlackListFilter;
import javafx.beans.value.ChangeListener;
import javafx.beans.value.ObservableValue;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.geometry.Insets;
import javafx.geometry.Orientation;
import javafx.scene.control.Button;
import javafx.scene.control.ButtonBar;
import javafx.scene.control.ButtonType;
import javafx.scene.control.ChoiceBox;
import javafx.scene.control.Dialog;
import javafx.scene.control.Label;
import javafx.scene.control.ListView;
import javafx.scene.control.SelectionMode;
import javafx.scene.control.TextField;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.GridPane;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.ResourceBundle;
import java.util.function.Consumer;

/**
 * The setup is used to show a dialog to the user
 * which asks for account information like name, avatar and locale.
 */
public class UserDialogSetup {
    /**
     * OK Button type for look up purposes.
     */
    private final ButtonType OK_BUTTON_TYPE = new ButtonType("", ButtonBar.ButtonData.OK_DONE);
    /**
     * The user object that already exists;
     */
    private final User existingUser;
    private final boolean needToCreateNewPlayer;
    /**
     * The index of the image which is just selected.
     */
    private int editedImageIndex;
    /**
     * The currently selected locale.
     */
    private Locale editedLocale;
    /**
     * the resource bundle for the language strings.
     */
    private ResourceBundle bundle;
    /**
     * The dialog that is shown for account settings.
     */
    private Dialog<User> dialog;
    /**
     * the ok listener.
     */
    private Consumer<User> onOKListener;
    /**
     * The cancel listener.
     */
    private Consumer<User> onCancelListener;
    /**
     * Only of interest in the moment the dialog s
     */
    private boolean dialogWasCancelled;
    /**
     * maps locales with the user readable strings.
     */
    private HashMap<String, Locale> localeNames;
    /**
     * User name filter looking for disallowed words.
     */
    private WordBlackListFilter nameFilter;

    /**
     * Creates a new setup for creating a new user.
     */
    public UserDialogSetup() {
        this(null);
    }

    public UserDialogSetup(User existingUser) {
        this.existingUser = existingUser;
        this.needToCreateNewPlayer = existingUser == null;
        this.nameFilter = new WordBlackListFilter(WordBlackListFilter.Mode.NORMAL);
        updateLocale();
        localeNames = new HashMap<>(2);
        localeNames.put("Deutsch", Locale.GERMAN);
        localeNames.put("English", Locale.ENGLISH);
        dialog = new Dialog<>();
        dialog.setTitle(bundle.getString("title"));
        dialog.setHeaderText(bundle.getString("header"));
        dialog.setGraphic(new ImageView(this.getClass().getResource("Icon.png").toString()));
    }

    /**
     * shows a dialog for changing the account.
     *
     * @param images images that can be chosen.
     */
    public void setUpAccount(Image... images) {
        dialog.getDialogPane().getButtonTypes().addAll(OK_BUTTON_TYPE, ButtonType.CANCEL);
        GridPane grid = new GridPane();
        grid.setHgap(10);
        grid.setVgap(10);
        grid.setPadding(new Insets(20, 150, 10, 10));

        TextField username = new TextField();
        username.setPromptText(bundle.getString("username"));
        username.setText(existingUser == null ? "" : existingUser.getName());
        ChoiceBox<String> languageBox = new ChoiceBox<>();
        ObservableList<String> languages = FXCollections.observableArrayList();
        Locale existingLocale = existingUser == null ? null : existingUser.getLocale();
        int selectionIndex = 0, i = 0;
        for (Map.Entry<String, Locale> entry : localeNames.entrySet()) {
            languages.add(entry.getKey());
            if (entry.getValue().equals(existingLocale)) {
                selectionIndex = i;
            }
            i++;
        }
        languageBox.setItems(languages);
        languageBox.getSelectionModel().select(selectionIndex);

        ListView<ImageView> imageList = new ListView<>();
        imageList.setMaxHeight(70);
        imageList.setOrientation(Orientation.HORIZONTAL);
        imageList.setCellFactory(list -> new ImageCell());
        imageList.getSelectionModel().setSelectionMode(SelectionMode.SINGLE);
        imageList.getFocusModel().focus(0);

        ObservableList<ImageView> imgViews = FXCollections.observableArrayList();
        for (Image image : images) {
            ImageView imgView = new ImageView(image);
            imgView.setFitWidth(30);
            imgView.setPreserveRatio(true);
            imgView.setSmooth(true);
            imgView.setCache(true);
            imgViews.add(imgView);
        }
        imageList.setItems(imgViews);
        imageList.getSelectionModel().select(existingUser == null ? 0 : existingUser.getImageID());

        Label labelUserName = new Label(bundle.getString("username"));
        Label labelLanguage = new Label(bundle.getString("language"));
        Label labelIcon = new Label("Icon");

        grid.add(labelUserName, 0, 0);
        grid.add(username, 1, 0);
        grid.add(labelLanguage, 0, 1);
        grid.add(languageBox, 1, 1);
        grid.add(labelIcon, 0, 2);
        grid.add(imageList, 1, 2);

        Button submit = (Button) dialog.getDialogPane().lookupButton(OK_BUTTON_TYPE);
        submit.setMinWidth(70);
        Button cancelButton = (Button) dialog.getDialogPane().lookupButton(ButtonType.CANCEL);
        if (needToCreateNewPlayer) {
            submit.setDisable(true);
        }
        submit.setText(bundle.getString("submit"));
        cancelButton.setText(bundle.getString("cancel"));

        username.textProperty().addListener((observable, oldValue, newValue) -> {
            submit.setDisable(!isUserNameValid(newValue));
        });

        languageBox.getSelectionModel().selectedItemProperty().addListener(new ChangeListener<String>() {
            @Override
            public void changed(ObservableValue<? extends String> observable, String oldValue, String newLocaleName) {
                editedLocale = localeNames.get(newLocaleName);
                updateLocale();
                dialog.setTitle(bundle.getString("title"));
                dialog.setHeaderText(bundle.getString("header"));
                labelUserName.setText(bundle.getString("username"));
                labelLanguage.setText(bundle.getString("language"));
                username.setPromptText(bundle.getString("username"));
                submit.setText(bundle.getString("submit"));
                cancelButton.setText(bundle.getString("cancel"));
            }
        });

        dialog.getDialogPane().setContent(grid);

        final TextField finalUsername = username;
        dialog.setResultConverter(dialogButton -> {
            if (dialogButton == OK_BUTTON_TYPE) {
                dialogWasCancelled = false;
                int selectedImageIndex = imageList.getSelectionModel().getSelectedIndex();
                return new User(finalUsername.getText(), editedLocale, selectedImageIndex);//todo
            } else {
                dialogWasCancelled = true;
                return existingUser;
            }
        });

        Optional<User> result = dialog.showAndWait();
        result.ifPresent(validatedUser -> {
            if (dialogWasCancelled) {
                if(onCancelListener != null){
                    onCancelListener.accept(existingUser);
                }
            } else if(onOKListener != null){
                if (existingUser == null) {
                    onOKListener.accept(validatedUser);
                } else{
                    onOKListener.accept(existingUser);
                }
            }
        });
    }

    private Locale getDefaultLocale() {
        return Locale.ENGLISH;
    }

    private void updateLocale() {
        Locale locale = editedLocale == null ? getDefaultLocale() : editedLocale;
        if (needToCreateNewPlayer) {
            bundle = ResourceBundle.getBundle("de.hhn.labsw.laspoly.main.GetUserDetailDialog", locale);
        } else {
            bundle = ResourceBundle.getBundle("de.hhn.labsw.laspoly.view.lobby.ChangeUserDetailDialog", locale);
        }
    }

    /**
     * Checks the user name length and its phrases.
     *
     * @param name the new user name
     * @return true if the name is valid, false otherwise.
     */
    private boolean isUserNameValid(String name) {
        final int length = name.trim().length();
        return length > 1 && length < 30 && nameFilter.isUserNameOK(name);
    }

    /**
     * Sets a listener that will be called when the user has clicked the ok button of the dialog.
     *
     * @param onResultListener a listener.
     */
    public void setOnOKListener(Consumer<User> onResultListener) {
        this.onOKListener = onResultListener;
    }

    /**
     * Sets a listener that will be called when the user has clicked the cancel button of the dialog.
     *
     * @param onResultListener a listener.
     */
    public void setOnCancelListener(Consumer<User> onResultListener) {
        this.onCancelListener = onResultListener;
    }
}
