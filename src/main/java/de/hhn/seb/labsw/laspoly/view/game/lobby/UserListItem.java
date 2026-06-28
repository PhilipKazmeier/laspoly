/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.Cursor
 *  javafx.scene.control.Label
 *  javafx.scene.image.ImageView
 *  javafx.scene.layout.AnchorPane
 *  javafx.scene.layout.StackPane
 *  javafx.scene.paint.Color
 *  javafx.scene.paint.Paint
 */
package de.hhn.seb.labsw.laspoly.view.game.lobby;

import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import de.hhn.seb.labsw.laspoly.view.game.lobby.GameLobbyController;
import java.util.logging.Logger;
import javafx.scene.Cursor;
import javafx.scene.control.Label;
import javafx.scene.image.ImageView;
import javafx.scene.layout.AnchorPane;
import javafx.scene.layout.StackPane;
import javafx.scene.paint.Color;
import javafx.scene.paint.Paint;

public class UserListItem {
    private final User user;
    private final GameLobbyController controller;
    private final Logger logger = LoggerFactory.initializeLogger(this.getClass(), "de/hhn/seb/labsw/laspoly/view/view_logging.properties");
    private Label hostLabel;
    private StackPane root;
    private Label userNameLabel;
    private ImageView playerReady;
    private AnchorPane kickPane;

    public UserListItem(User listUser, GameLobbyController gameLobbyController) {
        this.user = listUser;
        this.controller = gameLobbyController;
        this.create();
    }

    private void create() {
        this.root = (StackPane)FXMLFile.LIST_USER.toLayout(this.getClass());
        ImageView flagImage = (ImageView)this.root.lookup("#flagImage");
        flagImage.setImage(DataLoader.getInstance().getFlagImage(this.user.getLocale()));
        flagImage.setFitHeight(30.0);
        flagImage.setFitWidth(30.0);
        this.userNameLabel = (Label)this.root.lookup("#userNameLabel");
        this.userNameLabel.setText(this.user.getName());
        this.hostLabel = (Label)this.root.lookup("#hostLabel");
        this.playerReady = (ImageView)this.root.lookup("#playerReady");
        this.playerReady.setFitHeight(24.0);
        this.playerReady.setFitWidth(24.0);
        this.kickPane = (AnchorPane)this.root.lookup("#kickPane");
        this.kickPane.setVisible(false);
        Label kickPlayerLabel = (Label)this.root.lookup("#kickPlayerLabel");
        kickPlayerLabel.setText(this.controller.getBundle().getString("kickPlayer"));
        this.refreshHost();
        this.root.setOnMouseExited(ev -> this.kickPane.setVisible(false));
        this.kickPane.setMaxWidth(310.0);
        this.kickPane.setOnMouseClicked(ev -> this.controller.kickPlayer(this.user));
        this.kickPane.setCursor(Cursor.HAND);
    }

    private void refreshHost() {
        if (this.controller.getMainWindowController().getGame().isHost(this.user)) {
            this.hostLabel.setVisible(true);
        } else {
            this.root.setOnMouseEntered(ev -> {
                if (this.controller.getMainWindowController().getGame().isHost(this.controller.getMainWindowController().getClient().getUser()) && !this.controller.getMainWindowController().getClient().getUser().equals(this.user)) {
                    this.kickPane.setVisible(true);
                }
            });
        }
    }

    public StackPane getPane() {
        this.refreshHost();
        return this.root;
    }

    public void setNameLabelColor(Color color) {
        this.userNameLabel.setTextFill((Paint)color);
    }

    public ImageView getPlayerReadyView() {
        return this.playerReady;
    }
}

