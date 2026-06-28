/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.control.Label
 */
package de.hhn.seb.labsw.laspoly.model.card;

import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.GameScene;
import de.hhn.seb.labsw.laspoly.view.paint.AbsNodeHolder;
import de.hhn.seb.labsw.laspoly.view.paint.PreviewDrawable;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Objects;
import java.util.ResourceBundle;
import java.util.logging.Logger;
import javafx.scene.control.Label;

public abstract class Card
implements PreviewDrawable {
    private final Logger logger = LoggerFactory.initializeLogger(this.getClass(), "de/hhn/seb/labsw/laspoly/view/game/gamescene/gamescene_logging.properties");
    private NodeHolder nodeHolder;

    public NodeHolder getNodeHolder() {
        return this.nodeHolder;
    }

    public void setNodeHolder(NodeHolder nodes) {
        this.nodeHolder = nodes;
    }

    @Override
    public EnhancedGroup drawPreview() {
        if (this.nodeHolder == null) {
            return new EnhancedGroup();
        }
        ResourceBundle res = GameScene.getResources();
        this.nodeHolder.updateLabelTexts(res);
        this.nodeHolder.colourLabelsFromInterest();
        this.nodeHolder.getLayout().setTranslateX(0.0);
        return this.nodeHolder.getLayout();
    }

    public String toString() {
        return this.getClass().getName() + "{" + "nodeHolder=" + this.nodeHolder + '}';
    }

    public abstract class NodeHolder
    implements AbsNodeHolder {
        private final ArrayList<Label> posInterestLabel = new ArrayList(0);
        private EnhancedGroup layoutGroup;
        private Label[] labels;

        public NodeHolder(FXMLFile resFile) {
            this.loadFXML(resFile);
        }

        public NodeHolder(FXMLFile resFile, EnhancedGroup layout) {
            if (layout == null) {
                this.loadFXML(resFile);
            } else {
                Card.this.logger.info("loading Card preview for " + this.getClass().getSimpleName() + "FXML file from existing group");
                this.layoutGroup = layout;
            }
        }

        private void loadFXML(FXMLFile resFile) {
            Card.this.logger.info("loading Card preview for " + this.getClass().getSimpleName() + "FXML file from disk");
            this.layoutGroup = new EnhancedGroup();
            this.layoutGroup.getChildren().add(resFile.toLayout(this.getClass()));
        }

        protected void lookUpLabels(String ... labelIDs) {
            Objects.requireNonNull(labelIDs);
            Label[] lbls = new Label[labelIDs.length];
            for (int i = 0; i < labelIDs.length; ++i) {
                lbls[i] = (Label)this.getLayout().lookup(labelIDs[i]);
            }
            this.labels = lbls;
        }

        public EnhancedGroup getLayout() {
            return this.layoutGroup;
        }

        protected abstract void updateLabelTexts(ResourceBundle var1);

        protected void update(Label l, ResourceBundle res, String id, Object ... formatObjects) {
            String newText = res.getString(id);
            if (formatObjects != null && formatObjects.length > 0) {
                newText = String.format(newText, formatObjects);
            }
            l.setText(newText);
        }

        protected void colourLabelsFromInterest() {
            Label[] allLabels = this.getAllLabels();
            int[] labelsFromInterest = this.getLabelsFromInterest();
            Arrays.stream(labelsFromInterest).forEach(i -> this.posInterestLabel.add(this.label(i)));
            for (Label lbl : this.posInterestLabel) {
                lbl.setStyle("-fx-text-fill: black;");
            }
            for (int lbl : labelsFromInterest) {
                allLabels[lbl].setStyle("-fx-text-fill: red;");
            }
        }

        protected Label[] getAllLabels() {
            return this.labels;
        }

        public Label label(int index) {
            return this.labels[index];
        }

        protected abstract int[] getLabelsFromInterest();

        @Override
        public double getBottomHeight() {
            return -1.0;
        }

        public String toString() {
            return this.getClass().getName() + "{" + "posInterestLabel=" + this.posInterestLabel + ", layoutGroup=" + this.layoutGroup + ", labels=" + Arrays.toString(this.labels) + '}';
        }
    }
}

