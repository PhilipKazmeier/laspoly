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

import de.hhn.seb.labsw.laspoly.model.action.SwapOfferAction;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import java.util.ResourceBundle;
import java.util.function.Consumer;
import javafx.animation.Interpolator;
import javafx.animation.TranslateTransition;
import javafx.scene.Cursor;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.image.ImageView;
import javafx.scene.layout.Pane;
import javafx.util.Duration;

public class SwapOfferDialog {
    private final Pane parentNode;
    private final SwapOfferAction swapOffer;
    private Pane layout;
    private Button button1;
    private Button button2;

    public SwapOfferDialog(ResourceBundle res, Pane parent, SwapOfferAction offer) {
        this.parentNode = parent;
        this.swapOffer = offer;
        String title = res.getString("swapoffer_title");
        String descr = offer.getStatus().equals(SwapOfferAction.Status.SENT) ? res.getString("swapoffer_description") : res.getString("swapoffer_description2");
        descr = offer.getStatus().equals(SwapOfferAction.Status.CHANGED_BY_RECEIVER) ? String.format(descr, offer.getReceiver().getName()) : String.format(descr, offer.getSender().getName());
        String buttonText = res.getString("swapoffer_buttontext");
        String button2Text = res.getString("swapoffer_button2text");
        this.layout = (Pane)FXMLFile.SWAPOFFER_DIALOG.toLayout(this.getClass());
        this.button1 = (Button)this.layout.lookup("#button");
        this.button2 = (Button)this.layout.lookup("#button2");
        Label titleLabel = (Label)this.layout.lookup("#titleLabel");
        titleLabel.setText(title);
        Label descriptLabel = (Label)this.layout.lookup("#descriptionLabel");
        descriptLabel.setText(descr);
        this.button1.setText(buttonText);
        this.button2.setText(button2Text);
        this.layout.setTranslateX(this.parentNode.getWidth() + this.layout.getPrefWidth());
        this.parentNode.widthProperty().addListener(e -> {
            if (this.parentNode.getChildren().contains(this.layout)) {
                this.layout.setTranslateX(this.parentNode.getWidth() - this.layout.getPrefWidth());
            } else {
                this.layout.setTranslateX(this.parentNode.getWidth() + this.layout.getPrefWidth());
            }
        });
        ImageView crossView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CROSS_GRAY));
        crossView.setFitHeight(25.0);
        crossView.setFitWidth(25.0);
        this.button2.setGraphic((Node)crossView);
        this.button2.setCursor(Cursor.HAND);
        ImageView checkView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CHECK));
        checkView.setFitHeight(25.0);
        checkView.setFitWidth(25.0);
        this.button1.setGraphic((Node)checkView);
        this.button1.setCursor(Cursor.HAND);
        parent.getChildren().add(this.layout);
    }

    public SwapOfferAction getSwapOffer() {
        return this.swapOffer;
    }

    public Pane getLayout() {
        return this.layout;
    }

    public void setListeners(Consumer<Boolean> listener) {
        this.button1.setOnAction(ev -> listener.accept(false));
        this.button2.setOnAction(ev -> listener.accept(true));
    }

    public void show() {
        TranslateTransition transition = new TranslateTransition(Duration.millis((double)1000.0), (Node)this.layout);
        transition.setInterpolator(Interpolator.EASE_OUT);
        transition.setToX(this.parentNode.getWidth() - this.layout.getPrefWidth());
        transition.play();
    }

    public void hide() {
        TranslateTransition mainTransition = new TranslateTransition(Duration.millis((double)500.0), (Node)this.layout);
        mainTransition.setInterpolator(Interpolator.EASE_IN);
        mainTransition.setToX(this.parentNode.getWidth() + this.layout.getPrefWidth());
        mainTransition.play();
        mainTransition.setOnFinished(e -> this.parentNode.getChildren().remove(this.layout));
    }
}

