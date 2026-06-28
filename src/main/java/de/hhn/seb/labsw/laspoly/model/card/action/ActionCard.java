/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.fxml.FXMLLoader
 *  javafx.geometry.Point3D
 *  javafx.scene.Cursor
 *  javafx.scene.Node
 *  javafx.scene.control.Button
 *  javafx.scene.control.Label
 *  javafx.scene.image.ImageView
 *  javafx.scene.layout.AnchorPane
 *  javafx.scene.layout.Pane
 */
package de.hhn.seb.labsw.laspoly.model.card.action;

import de.hhn.seb.labsw.laspoly.model.card.Card;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import de.hhn.seb.labsw.laspoly.utils.dataloading.ResourceBundleSource;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import java.io.IOException;
import java.util.Arrays;
import java.util.Locale;
import java.util.ResourceBundle;
import java.util.logging.Logger;
import javafx.fxml.FXMLLoader;
import javafx.geometry.Point3D;
import javafx.scene.Cursor;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.image.ImageView;
import javafx.scene.layout.AnchorPane;
import javafx.scene.layout.Pane;

public abstract class ActionCard
extends Card {
    private final String identifier;
    private final Logger logger;
    private Label actionCardText;
    private ResourceBundle bundle;
    private AnchorPane pane;
    private Button confirm;
    private Button optionOne;
    private Button optionTwo;
    private Object[] values;

    public ActionCard(Locale locale, String ident) {
        this.identifier = ident;
        this.values = new Object[0];
        this.logger = LoggerFactory.initializeLogger(this.getClass(), "de/hhn/seb/labsw/laspoly/view/game/gamescene/gamescene_logging.properties");
        FXMLLoader loader = new FXMLLoader(this.getClass().getResource("/de/hhn/seb/labsw/laspoly/model/card/action/actionCard.fxml"));
        try {
            this.pane = (AnchorPane)loader.load();
            this.pane.setRotate(180.0);
            this.pane.setRotationAxis(new Point3D(0.0, 0.0, 1.0));
            Label actionCardLabel = (Label)this.pane.lookup("#actionCardLabel");
            this.actionCardText = (Label)this.pane.lookup("#actionCardText");
            this.confirm = (Button)this.pane.lookup("#confirm");
            ImageView confirmView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CHECK));
            confirmView.setFitHeight(20.0);
            confirmView.setFitWidth(20.0);
            this.confirm.setGraphic((Node)confirmView);
            this.confirm.setCursor(Cursor.HAND);
            this.optionOne = (Button)this.pane.lookup("#optionOne");
            this.optionTwo = (Button)this.pane.lookup("#optionTwo");
            this.bundle = DataLoader.getInstance().getResourceBundle(ResourceBundleSource.ACTION_CARD, locale);
            actionCardLabel.setText(this.bundle.getString("title"));
            this.confirm.setText(this.bundle.getString("confirm"));
        }
        catch (IOException e) {
            this.logger.severe("Couldn't create a new action card");
            e.printStackTrace();
        }
    }

    @Override
    public final EnhancedGroup drawPreview() {
        return new EnhancedGroup(new Node[]{this.pane});
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "identifier='" + this.identifier + '\'' + ", actionCardText=" + this.actionCardText + ", bundle=" + this.bundle + ", pane=" + this.pane + ", confirm=" + this.confirm + ", optionOne=" + this.optionOne + ", optionTwo=" + this.optionTwo + ", values=" + Arrays.toString(this.values) + '}';
    }

    public final Pane drawPreviewPane() {
        return this.pane;
    }

    public abstract void activate(Figure var1, GameHandler var2);

    protected abstract void prepare(GameHandler var1);

    protected final Label getActionCardText() {
        return this.actionCardText;
    }

    protected final ResourceBundle getBundle() {
        return this.bundle;
    }

    public final String getIdentifier() {
        return this.identifier;
    }

    public final Button getConfirm() {
        return this.confirm;
    }

    public final Button getOptionOne() {
        return this.optionOne;
    }

    public final Button getOptionTwo() {
        return this.optionTwo;
    }

    public Object[] getValues() {
        return this.values;
    }

    protected void setValues(Object ... vals) {
        this.values = vals;
    }
}

