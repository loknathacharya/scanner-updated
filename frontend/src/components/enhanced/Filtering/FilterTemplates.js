import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Grid,
  Paper,
  Collapse,
} from '@mui/material';
import {
  FileCopy,
  Description,
  ExpandMore,
  ChevronRight,
} from '@mui/icons-material';
import './FilterTemplates.css';

const FilterTemplates = ({ templates, onSelectTemplate, disabled = false }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="filter-templates-card">
      <CardContent>
        <Box className="templates-header" onClick={() => setIsExpanded(!isExpanded)}>
          <Typography variant="h6" className="templates-title">
            <Description /> Filter Templates
          </Typography>
          <IconButton>
            {isExpanded ? <ExpandMore /> : <ChevronRight />}
          </IconButton>
        </Box>
        <Collapse in={isExpanded}>
          <Divider />
          <Grid container spacing={2} p={2}>
            {templates.map((template) => (
              <Grid item xs={12} md={6} key={template.id}>
                <Paper
                  className="template-item"
                  onClick={() => onSelectTemplate(template.filters)}
                >
                  <Typography variant="subtitle1" className="template-name">
                    {template.name}
                  </Typography>
                  <Typography variant="body2" className="template-description">
                    {template.description}
                  </Typography>
                  <Tooltip title="Use this template">
                    <span>
                      <IconButton
                        size="small"
                        className="use-template-btn"
                        disabled={disabled}
                      >
                        <FileCopy />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default FilterTemplates;