/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.animation.Interpolator
 *  javafx.animation.TranslateTransition
 *  javafx.scene.Cursor
 *  javafx.scene.Node
 *  javafx.scene.control.Button
 *  javafx.scene.control.Label
 *  javafx.scene.image.ImageView
 *  javafx.scene.layout.Pane
 *  javafx.util.Duration
 */
package de.hhn.seb.labsw.laspoly.view.game.gamescene;

import de.hhn.seb.labsw.laspoly.model.Player;
import de.hhn.seb.labsw.laspoly.model.field.Property;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import java.util.List;
import java.util.ResourceBundle;
import java.util.function.Consumer;
import java.util.logging.Logger;
import javafx.animation.Interpolator;
import javafx.animation.TranslateTransition;
import javafx.scene.Cursor;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.image.ImageView;
import javafx.scene.layout.Pane;
import javafx.util.Duration;

public class BuyDialog {
    private final List<Node> childList;
    private final Logger logger;
    private Pane layout;
    private Button cancelButton;
    private Button buyButton;

    public BuyDialog(ResourceBundle res, Player player, Property property, Pane parent) {
        this.childList = parent.getChildren();
        String title = res.getString("buydialog_wantbuythis");
        title = String.format(title, property.getName());
        String capital = res.getString("buydialog_yourcapital");
        capital = String.format(capital, player.getMoneyAmount());
        String price = res.getString("buydialog_pricetag");
        price = String.format(price, property.getPrice());
        this.logger = LoggerFactory.initializeLogger(this.getClass(), "de/hhn/seb/labsw/laspoly/view/view_logging.properties");
        this.layout = (Pane)FXMLFile.BUY_DIALOG.toLayout(this.getClass());
        this.cancelButton = (Button)this.layout.lookup("#cancelbutton");
        this.buyButton = (Button)this.layout.lookup("#buybutton");
        Label titleLabel = (Label)this.layout.lookup("#titleLabel");
        Label capitalLabel = (Label)this.layout.lookup("#capitalLabel");
        Label priceLabel = (Label)this.layout.lookup("#pricelabel");
        titleLabel.setText(title);
        priceLabel.setText(price);
        capitalLabel.setText(capital);
        this.cancelButton.setText(res.getString("buydialog_no"));
        this.buyButton.setText(res.getString("buydialog_yes"));
        this.layout.setTranslateX(-600.0);
        this.childList.add((Node)this.layout);
        ImageView checkView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CHECK));
        checkView.setFitHeight(25.0);
        checkView.setFitWidth(25.0);
        this.buyButton.setGraphic((Node)checkView);
        this.buyButton.setCursor(Cursor.HAND);
        ImageView crossView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CROSS));
        crossView.setFitHeight(25.0);
        crossView.setFitWidth(25.0);
        this.cancelButton.setGraphic((Node)crossView);
        this.cancelButton.setCursor(Cursor.HAND);
    }

    public Pane getLayout() {
        return this.layout;
    }

    public void setListener(Consumer<Boolean> listener) {
        this.buyButton.setOnAction(ev -> listener.accept(true));
        this.cancelButton.setOnAction(ev -> listener.accept(false));
    }

    public void show() {
        TranslateTransition transition = new TranslateTransition(Duration.millis((double)1000.0), (Node)this.layout);
        transition.setInterpolator(Interpolator.EASE_OUT);
        transition.setToX(0.0);
        transition.play();
    }

    public void hide() {
        TranslateTransition mainTransition = new TranslateTransition(Duration.millis((double)500.0), (Node)this.layout);
        mainTransition.setInterpolator(Interpolator.EASE_IN);
        mainTransition.setToX(-500.0);
        mainTransition.setOnFinished(e -> this.childList.remove(this.layout));
        mainTransition.play();
    }
}

