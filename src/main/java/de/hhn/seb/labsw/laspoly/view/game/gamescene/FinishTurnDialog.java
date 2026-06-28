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

import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import java.util.ResourceBundle;
import javafx.animation.Interpolator;
import javafx.animation.TranslateTransition;
import javafx.scene.Cursor;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.image.ImageView;
import javafx.scene.layout.Pane;
import javafx.util.Duration;

public class FinishTurnDialog {
    private final Pane parentNode;
    private Pane layout;
    private Button finishButton;

    public FinishTurnDialog(ResourceBundle res, Pane parent) {
        this.parentNode = parent;
        String title = res.getString("areyoudone");
        String descr = res.getString("finishturndialog_description");
        String buttonText = res.getString("finish");
        this.layout = (Pane)FXMLFile.FINISH_DIALOG.toLayout(this.getClass());
        this.finishButton = (Button)this.layout.lookup("#button");
        Label titleLabel = (Label)this.layout.lookup("#titleLabel");
        titleLabel.setText(title);
        Label descriptLabel = (Label)this.layout.lookup("#descriptionLabel");
        descriptLabel.setText(descr);
        this.finishButton.setText(buttonText);
        this.layout.setTranslateX(-this.layout.getPrefWidth());
        parent.getChildren().add(this.layout);
        ImageView checkView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CHECK));
        checkView.setFitHeight(25.0);
        checkView.setFitWidth(25.0);
        this.finishButton.setGraphic((Node)checkView);
        this.finishButton.setCursor(Cursor.HAND);
    }

    public Pane getLayout() {
        return this.layout;
    }

    public void setListener(Runnable listener) {
        this.finishButton.setOnAction(ev -> listener.run());
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
        mainTransition.setToX(-this.layout.getPrefWidth());
        mainTransition.play();
        mainTransition.setOnFinished(e -> this.parentNode.getChildren().remove(this.layout));
    }
}

